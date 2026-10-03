import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { supabase } from "./supabase";
import { authClient } from "./customerAuth";
import type { Role } from "@/lib/permissions";

export type StaffRow = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  pin_hash: string | null;
  totp_secret: string | null;
  totp_enabled: boolean;
  active: boolean;
  created_at: string;
  last_login_at: string | null;
};

export const STAFF_COLUMNS = "id,email,full_name,role,pin_hash,totp_secret,totp_enabled,active,created_at,last_login_at";

// ---- readiness: the staff table comes from supabase/admin-phase-0.sql --------------------------
let readiness: { at: number; ready: boolean; owners: number } | null = null;

export async function staffSystem(): Promise<{ ready: boolean; owners: number }> {
  if (readiness && Date.now() - readiness.at < 30_000) return readiness;
  // a real GET (not HEAD): HEAD on a missing table does not report an error
  const { data, error } = await supabase().from("staff").select("id").eq("role", "owner").eq("active", true).limit(20);
  readiness = { at: Date.now(), ready: !error, owners: data?.length ?? 0 };
  return readiness;
}
export function resetStaffSystemCache() {
  readiness = null;
  staffCache.clear();
}

// The emergency owner login (shared password). Off by default. It is allowed when ADMIN_EMERGENCY_LOGIN=true,
// and ALSO while no staff owner exists yet (before the migration is run / the first owner is created),
// so the store can never lock itself out during roll-out.
export async function emergencyLoginAllowed(): Promise<boolean> {
  if (process.env.ADMIN_EMERGENCY_LOGIN === "true") return true;
  const s = await staffSystem();
  return !s.ready || s.owners === 0;
}

// ---- staff lookups (30 s cache so a deactivated account stops within seconds) -------------------
const staffCache = new Map<string, { at: number; row: StaffRow | null }>();

export async function getStaff(id: string, fresh = false): Promise<StaffRow | null> {
  const hit = staffCache.get(id);
  if (!fresh && hit && Date.now() - hit.at < 30_000) return hit.row;
  const { data } = await supabase().from("staff").select(STAFF_COLUMNS).eq("id", id).maybeSingle();
  const row = (data as StaffRow | null) ?? null;
  staffCache.set(id, { at: Date.now(), row });
  return row;
}

export function forgetStaff(id: string) {
  staffCache.delete(id);
}

// Email + password via Supabase Auth, then the matching active staff row (customers share the same
// auth users table, so "has a staff row" is what makes someone staff).
export async function verifyStaffPassword(email: string, password: string): Promise<StaffRow | null> {
  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  if (error || !data.user) return null;
  const staff = await getStaff(data.user.id, true);
  return staff && staff.active ? staff : null;
}

// ---- PIN (4-6 digits) for fast cashier switching: scrypt-hashed ----------------------------------
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
export function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [kind, saltHex, hashHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const given = scryptSync(pin, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, given);
}

export const publicStaff = (s: StaffRow) => ({
  id: s.id,
  email: s.email,
  fullName: s.full_name,
  role: s.role,
  active: s.active,
  hasPin: !!s.pin_hash,
  totpEnabled: s.totp_enabled,
  createdAt: s.created_at,
  lastLoginAt: s.last_login_at,
});
