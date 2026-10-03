import { NextResponse } from "next/server";
import { currentSession } from "@/lib/server/guard";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/server/rateLimit";
import { getStaff, staffSystem, verifyPin } from "@/lib/server/staff";
import { setSessionCookie } from "@/lib/server/sessionCookie";
import { supabase } from "@/lib/server/supabase";
import { pinSwitchSchema } from "@/lib/schemas/admin";

// Fast cashier switching at the till. Needs an already signed-in device session, and only
// switches to cashier / stock-keeper accounts (owners and managers always use password + 2FA).

export async function GET() {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await staffSystem()).ready) return NextResponse.json({ staff: [] });
  const { data } = await supabase().from("staff").select("id,full_name,role,pin_hash").in("role", ["cashier", "stock"]).eq("active", true).order("full_name");
  return NextResponse.json({
    staff: (data ?? []).filter((s) => s.pin_hash).map((s) => ({ id: s.id as string, name: s.full_name as string, role: s.role as string })),
  });
}

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const limited = await rateLimit(request, "admin-pin", 10, 5 * 60);
  if (limited) return limited;

  const parsed = pinSwitchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 4-6 digit PIN" }, { status: 400 });
  const staff = await getStaff(parsed.data.staffId, true);
  if (!staff || !staff.active || (staff.role !== "cashier" && staff.role !== "stock") || !verifyPin(parsed.data.pin, staff.pin_hash)) {
    await audit({ action: "auth.pin_failed", entity: "staff", entityId: parsed.data.staffId });
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, name: staff.full_name, role: staff.role });
  await setSessionCookie(res, { sid: staff.id, role: staff.role, name: staff.full_name, tf: true });
  await audit({
    action: "auth.pin_switch",
    entity: "staff",
    entityId: staff.id,
    note: `switched from ${session.name}`,
    actor: { id: staff.id, name: staff.full_name, role: staff.role },
  });
  return res;
}
