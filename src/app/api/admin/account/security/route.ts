import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { z } from "zod";
import { currentSession } from "@/lib/server/guard";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rateLimit";
import { forgetStaff, getStaff, hashPin, verifyStaffPassword } from "@/lib/server/staff";
import { decryptSecret, encryptSecret, generateSecret, isEncryptionConfigured, otpauthUrl, verifyTotp } from "@/lib/server/totp";
import { setSessionCookie } from "@/lib/server/sessionCookie";
import { authClient } from "@/lib/server/customerAuth";
import { supabase } from "@/lib/server/supabase";
import { passwordSchema, pinSchema, totpCodeSchema } from "@/lib/schemas/admin";
import { generateRecoveryCodes } from "@/lib/server/recovery";

// A staff member's own security settings: two-factor enrolment, their till PIN and password.
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("totp-start") }),
  z.object({ action: z.literal("totp-confirm"), code: totpCodeSchema }),
  z.object({ action: z.literal("recovery-regenerate"), code: totpCodeSchema }),
  z.object({ action: z.literal("set-pin"), pin: pinSchema }),
  z.object({ action: z.literal("change-password"), currentPassword: z.string().min(1), newPassword: passwordSchema }),
]);

export async function POST(request: Request) {
  const limited = await rateLimit(request, "admin-account", 20, 15 * 60);
  if (limited) return limited;
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (session.sid === "emergency") return NextResponse.json({ error: "The emergency login has no personal settings. Sign in with a staff account." }, { status: 400 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const staff = await getStaff(session.sid, true);
  if (!staff || !staff.active) return NextResponse.json({ error: "Account not found" }, { status: 401 });
  const body = parsed.data;
  const actor = { id: staff.id, name: staff.full_name, role: staff.role };

  if (body.action === "totp-start") {
    if (!isEncryptionConfigured()) return NextResponse.json({ error: "ADMIN_ENCRYPTION_KEY is not set on the server." }, { status: 503 });
    const secret = generateSecret();
    await supabase().from("staff").update({ totp_secret: encryptSecret(secret), totp_enabled: false }).eq("id", staff.id);
    forgetStaff(staff.id);
    const url = otpauthUrl(secret, staff.email);
    return NextResponse.json({ secret, otpauth: url, qr: await QRCode.toDataURL(url, { margin: 1, width: 220 }) });
  }

  if (body.action === "totp-confirm") {
    const secret = staff.totp_secret ? decryptSecret(staff.totp_secret) : null;
    if (!secret || !verifyTotp(secret, body.code)) return NextResponse.json({ error: "That code isn't right. Check the time on your phone." }, { status: 400 });
    // 10 one-time recovery codes: shown once now, stored only as hashes
    const { codes, hashes } = generateRecoveryCodes(staff.id);
    await supabase().from("staff").update({ totp_enabled: true, recovery_codes: hashes }).eq("id", staff.id);
    forgetStaff(staff.id);
    await audit({ action: "staff.totp_enabled", entity: "staff", entityId: staff.id, note: "10 recovery codes issued", actor });
    // 2FA is done: reissue the session without the setup lock
    const res = NextResponse.json({ ok: true, recoveryCodes: codes });
    await setSessionCookie(res, { sid: staff.id, role: staff.role, name: staff.full_name, tf: true });
    return res;
  }

  if (body.action === "recovery-regenerate") {
    const secret = staff.totp_secret ? decryptSecret(staff.totp_secret) : null;
    if (!staff.totp_enabled || !secret || !verifyTotp(secret, body.code)) return NextResponse.json({ error: "That code isn't right" }, { status: 400 });
    const { codes, hashes } = generateRecoveryCodes(staff.id);
    await supabase().from("staff").update({ recovery_codes: hashes }).eq("id", staff.id);
    forgetStaff(staff.id);
    await audit({ action: "staff.recovery_codes_regenerated", entity: "staff", entityId: staff.id, note: "old codes no longer work", actor });
    return NextResponse.json({ ok: true, recoveryCodes: codes });
  }

  if (body.action === "set-pin") {
    await supabase().from("staff").update({ pin_hash: hashPin(body.pin) }).eq("id", staff.id);
    forgetStaff(staff.id);
    await audit({ action: "staff.pin_set", entity: "staff", entityId: staff.id, actor }); // never log the PIN
    return NextResponse.json({ ok: true });
  }

  // change-password: needs the current password
  const ok = await verifyStaffPassword(staff.email, body.currentPassword);
  if (!ok) return NextResponse.json({ error: "Your current password isn't right" }, { status: 400 });
  const { error } = await authClient().auth.admin.updateUserById(staff.id, { password: body.newPassword });
  if (error) return NextResponse.json({ error: "Couldn't change the password" }, { status: 500 });
  await audit({ action: "staff.password_changed", entity: "staff", entityId: staff.id, actor });
  return NextResponse.json({ ok: true });
}
