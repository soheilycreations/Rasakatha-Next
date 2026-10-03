import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, readSession, type Session } from "./adminAuth";
import { can, type Permission } from "@/lib/permissions";
import { emergencyLoginAllowed, getStaff, staffSystem, type StaffRow } from "./staff";

// Server-side permission checks for route handlers and server actions. The proxy already gates
// routes by role; this adds the live staff check (still active? same role?) and is what handlers
// call to know WHO is acting.

export async function currentSession(): Promise<Session | null> {
  const jar = await cookies();
  return readSession(jar.get(ADMIN_COOKIE)?.value);
}

export type Actor = { id: string; name: string; role: Session["role"] };

export async function currentActor(): Promise<Actor | null> {
  const s = await currentSession();
  return s ? { id: s.sid, name: s.name, role: s.role } : null;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export type Guarded = { ok: true; session: Session; staff: StaffRow | null } | { ok: false; response: NextResponse };

const deny = (status: number, error: string): Guarded => ({ ok: false, response: NextResponse.json({ error }, { status }) });

export async function requirePermission(permission: Permission): Promise<Guarded> {
  const session = await currentSession();
  if (!session) return deny(401, "Not signed in");
  if (!session.tf) return deny(403, "Set up two-factor authentication first");

  let staff: StaffRow | null = null;
  if (session.sid === "emergency") {
    if (!(await emergencyLoginAllowed())) return deny(401, "Emergency login is disabled");
  } else if ((await staffSystem()).ready) {
    staff = await getStaff(session.sid);
    if (!staff || !staff.active) return deny(401, "This account is no longer active");
    // the role stored in the database wins over the one in an older cookie
    if (staff.role !== session.role) return deny(401, "Your role changed: please sign in again");
  }
  if (!can(session.role, permission)) return deny(403, "You don't have permission to do that");
  return { ok: true, session, staff };
}
