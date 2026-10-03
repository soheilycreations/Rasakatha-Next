import { NextResponse } from "next/server";
import { audit } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/guard";
import { authClient } from "@/lib/server/customerAuth";
import { supabase } from "@/lib/server/supabase";
import { forgetStaff, hashPin, publicStaff, resetStaffSystemCache, STAFF_COLUMNS, type StaffRow } from "@/lib/server/staff";
import { staffCreateSchema, staffUpdateSchema } from "@/lib/schemas/admin";

// Staff management: owner only (route table in src/lib/permissions.ts + the check below).

export async function GET() {
  const auth = await requirePermission("staff.manage");
  if (!auth.ok) return auth.response;
  const { data, error } = await supabase().from("staff").select(STAFF_COLUMNS).order("created_at");
  if (error) return NextResponse.json({ items: [], tableMissing: true });
  return NextResponse.json({ items: (data as StaffRow[]).map(publicStaff) });
}

export async function POST(request: Request) {
  const auth = await requirePermission("staff.manage");
  if (!auth.ok) return auth.response;
  const parsed = staffCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const d = parsed.data;

  const { data: created, error } = await authClient().auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
    app_metadata: { role: d.role, staff: true },
    user_metadata: { name: d.fullName },
  });
  if (error || !created.user) {
    const exists = /already|registered|exists/i.test(error?.message ?? "");
    return NextResponse.json({ error: exists ? "That email already has an account. Use a different email." : "Couldn't create the account" }, { status: exists ? 409 : 500 });
  }
  const row = { id: created.user.id, email: d.email, full_name: d.fullName, role: d.role, pin_hash: d.pin ? hashPin(d.pin) : null, active: true };
  const { error: insertError } = await supabase().from("staff").insert(row);
  if (insertError) {
    await authClient().auth.admin.deleteUser(created.user.id); // roll back the half-created account
    return NextResponse.json({ error: "Couldn't save the staff record" }, { status: 500 });
  }
  resetStaffSystemCache();
  await audit({ action: "staff.create", entity: "staff", entityId: row.id, after: { email: d.email, fullName: d.fullName, role: d.role, pin: !!d.pin } });
  return NextResponse.json({ ok: true, id: row.id });
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("staff.manage");
  if (!auth.ok) return auth.response;
  const parsed = staffUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const d = parsed.data;

  const { data: before } = await supabase().from("staff").select(STAFF_COLUMNS).eq("id", d.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  const current = before as StaffRow;

  // never lock the shop out: the last active owner can't be demoted or deactivated
  const losingOwner = current.role === "owner" && ((d.role && d.role !== "owner") || d.active === false);
  if (losingOwner) {
    const { data: owners } = await supabase().from("staff").select("id").eq("role", "owner").eq("active", true).limit(5);
    if ((owners?.length ?? 0) <= 1) return NextResponse.json({ error: "There must be at least one active owner." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (d.fullName !== undefined) patch.full_name = d.fullName;
  if (d.role !== undefined) patch.role = d.role;
  if (d.active !== undefined) patch.active = d.active;
  if (d.pin !== undefined) patch.pin_hash = d.pin === null ? null : hashPin(d.pin);
  if (d.resetTotp) Object.assign(patch, { totp_secret: null, totp_enabled: false, recovery_codes: [] });
  if (Object.keys(patch).length) {
    const { error } = await supabase().from("staff").update(patch).eq("id", d.id);
    if (error) return NextResponse.json({ error: "Couldn't update" }, { status: 500 });
  }
  if (d.password) {
    const { error } = await authClient().auth.admin.updateUserById(d.id, { password: d.password });
    if (error) return NextResponse.json({ error: "Couldn't reset the password" }, { status: 500 });
  }
  if (d.role) await authClient().auth.admin.updateUserById(d.id, { app_metadata: { role: d.role, staff: true } });
  forgetStaff(d.id);
  resetStaffSystemCache();

  await audit({
    action: "staff.update",
    entity: "staff",
    entityId: d.id,
    before: { fullName: current.full_name, role: current.role, active: current.active, pin: !!current.pin_hash, totp: current.totp_enabled },
    after: { fullName: d.fullName, role: d.role, active: d.active, pinChanged: d.pin !== undefined, passwordReset: !!d.password, totpReset: !!d.resetTotp },
  });
  if (d.resetTotp) {
    // its own audit row: resetting someone's two-factor is a sensitive action
    await audit({
      action: "staff.totp_reset",
      entity: "staff",
      entityId: d.id,
      before: { totp: current.totp_enabled, recoveryCodesLeft: current.recovery_codes?.length ?? 0 },
      note: `two-factor reset for ${current.full_name} by ${auth.session.name}`,
    });
  }
  return NextResponse.json({ ok: true });
}
