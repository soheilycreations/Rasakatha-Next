import { NextResponse } from "next/server";
import { readTicket } from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { audit } from "@/lib/server/audit";
import { getStaff } from "@/lib/server/staff";
import { decryptSecret, verifyTotp } from "@/lib/server/totp";
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
  if (!verifyTotp(secret, parsed.data.code)) {
    await audit({ action: "auth.totp_failed", entity: "staff", entityId: staff.id, actor: { id: staff.id, name: staff.full_name, role: staff.role } });
    return NextResponse.json({ error: "That code isn't right" }, { status: 401 });
  }
  const res = NextResponse.json({ step: "done", redirect: homeFor(staff.role) });
  await setSessionCookie(res, { sid: staff.id, role: staff.role, name: staff.full_name, tf: true });
  await audit({ action: "auth.login", entity: "staff", entityId: staff.id, note: "with 2FA", actor: { id: staff.id, name: staff.full_name, role: staff.role } });
  return res;
}
