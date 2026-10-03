import { NextResponse } from "next/server";
import { readTicket } from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { audit } from "@/lib/server/audit";
import { getStaff } from "@/lib/server/staff";
import { decryptSecret, verifyTotp } from "@/lib/server/totp";
import { consumeRecoveryCode } from "@/lib/server/recovery";
import { supabase } from "@/lib/server/supabase";
import { forgetStaff } from "@/lib/server/staff";
import { setSessionCookie } from "@/lib/server/sessionCookie";
import { totpLoginSchema } from "@/lib/schemas/admin";
import { homeFor } from "@/lib/permissions";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "admin-totp", 10, 15 * 60);
  if (limited) return limited;
  const parsed = totpLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });

  const sid = await readTicket(parsed.data.ticket);
  const staff = sid ? await getStaff(sid, true) : null;
  const secret = staff?.totp_secret ? decryptSecret(staff.totp_secret) : null;
  if (!staff || !staff.active || !secret) return NextResponse.json({ error: "Your sign-in expired. Start again." }, { status: 401 });
  const code = parsed.data.code;
  const isRecovery = !/^\d{6}$/.test(code);
  let remaining: number | null = null;
  if (isRecovery) {
    // one-time recovery code: valid once, then removed
    const left = consumeRecoveryCode(code, staff.id, staff.recovery_codes ?? []);
    if (!left) {
      await audit({ action: "auth.recovery_code_failed", entity: "staff", entityId: staff.id, actor: { id: staff.id, name: staff.full_name, role: staff.role } });
      return NextResponse.json({ error: "That recovery code isn't valid (or was already used)" }, { status: 401 });
    }
    await supabase().from("staff").update({ recovery_codes: left }).eq("id", staff.id);
    forgetStaff(staff.id);
    remaining = left.length;
    await audit({ action: "auth.recovery_code_used", entity: "staff", entityId: staff.id, note: `${left.length} recovery codes left`, actor: { id: staff.id, name: staff.full_name, role: staff.role } });
  } else if (!verifyTotp(secret, code)) {
    await audit({ action: "auth.totp_failed", entity: "staff", entityId: staff.id, actor: { id: staff.id, name: staff.full_name, role: staff.role } });
    return NextResponse.json({ error: "That code isn't right" }, { status: 401 });
  }
  const res = NextResponse.json({ step: "done", redirect: remaining !== null ? "/admin/account?recovered=1" : homeFor(staff.role), recoveryCodesLeft: remaining });
  await setSessionCookie(res, { sid: staff.id, role: staff.role, name: staff.full_name, tf: true });
  await audit({ action: "auth.login", entity: "staff", entityId: staff.id, note: remaining !== null ? "with a recovery code" : "with 2FA", actor: { id: staff.id, name: staff.full_name, role: staff.role } });
  return res;
}
