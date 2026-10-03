import { NextResponse } from "next/server";
import { createTicket, isAdminConfigured, safeEqual } from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { audit } from "@/lib/server/audit";
import { emergencyLoginAllowed, staffSystem, verifyStaffPassword } from "@/lib/server/staff";
import { setSessionCookie } from "@/lib/server/sessionCookie";
import { supabase } from "@/lib/server/supabase";
import { emergencyLoginSchema, loginSchema } from "@/lib/schemas/admin";
import { homeFor } from "@/lib/permissions";

// Staff sign in: email + password (Supabase Auth). Owners and managers then need a TOTP code
// (or must enrol one first). {password} alone is the emergency owner login, disabled by default.
export async function POST(request: Request) {
  const limited = await rateLimit(request, "admin-login", 8, 15 * 60);
  if (limited) return limited;
  if (!isAdminConfigured()) return NextResponse.json({ error: "Admin login is not configured on this server." }, { status: 503 });

  const body = await request.json().catch(() => null);

  // ---- staff login -------------------------------------------------------------------------
  if (body && typeof body === "object" && "email" in body) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
    const sys = await staffSystem();
    if (!sys.ready) return NextResponse.json({ error: "Staff accounts aren't set up yet. Use the emergency login." }, { status: 503 });

    const staff = await verifyStaffPassword(parsed.data.email, parsed.data.password);
    if (!staff) {
      await audit({ action: "auth.login_failed", entity: "staff", note: parsed.data.email, actor: null });
      return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
    }
    await supabase().from("staff").update({ last_login_at: new Date().toISOString() }).eq("id", staff.id);

    const needsTwoFactor = staff.role === "owner" || staff.role === "manager";
    if (needsTwoFactor && staff.totp_enabled) {
      return NextResponse.json({ step: "totp", ticket: await createTicket(staff.id) });
    }
    const res = NextResponse.json({ step: needsTwoFactor ? "enroll" : "done", redirect: needsTwoFactor ? "/admin/account?setup=1" : homeFor(staff.role) });
    await setSessionCookie(res, { sid: staff.id, role: staff.role, name: staff.full_name, tf: !needsTwoFactor });
    await audit({ action: "auth.login", entity: "staff", entityId: staff.id, actor: { id: staff.id, name: staff.full_name, role: staff.role } });
    return res;
  }

  // ---- emergency owner login ---------------------------------------------------------------------
  const emergency = emergencyLoginSchema.safeParse(body);
  if (!emergency.success) return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  const password = process.env.ADMIN_PASSWORD;
  if (!(await emergencyLoginAllowed()) || !password) {
    return NextResponse.json({ error: "Sign in with your staff email and password." }, { status: 401 });
  }
  if (!(await safeEqual(emergency.data.password, password))) {
    await audit({ action: "auth.login_failed", entity: "staff", note: "emergency", actor: null });
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ step: "done", redirect: "/admin" });
  await setSessionCookie(res, { sid: "emergency", role: "owner", name: "Emergency owner", tf: true });
  await audit({ action: "auth.emergency_login", entity: "staff", entityId: "emergency", actor: { id: "emergency", name: "Emergency owner", role: "owner" } });
  return res;
}

// Tells the login page which sign-in options to show (no secrets).
export async function GET() {
  const sys = await staffSystem();
  return NextResponse.json({ staffReady: sys.ready && sys.owners > 0, emergencyAllowed: await emergencyLoginAllowed() });
}
