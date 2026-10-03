import { supabase } from "./supabase";
import { clientIp, currentActor, type Actor } from "./guard";

// Append-only audit trail (table audit_log, supabase/admin-phase-0.sql blocks UPDATE/DELETE).
// Every create/update/delete on books, prices, stock, orders, payments, customers, staff and settings
// calls this. It never throws: a failing audit write is logged loudly but must not break the action.

export type AuditEntry = {
  action: string; // e.g. "books.update", "settings.update", "orders.status"
  entity: string; // e.g. "book", "order", "settings", "staff"
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  note?: string;
  actor?: Actor | null; // defaults to the signed-in staff member
};

// Drop huge/binary-ish values so one row stays small.
function trim(value: unknown): unknown {
  if (value === undefined) return null;
  const json = JSON.stringify(value, (_k, v) => (typeof v === "string" && v.length > 2000 ? v.slice(0, 2000) + "…" : v));
  return json.length > 20_000 ? { truncated: true } : JSON.parse(json);
}

export function buildAuditRow(entry: AuditEntry, actor: Actor | null, ip: string) {
  return {
    actor_id: actor && actor.id !== "emergency" ? actor.id : null,
    actor_name: actor ? (actor.id === "emergency" ? "Emergency owner" : actor.name) : "System",
    actor_role: actor?.role ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    before: trim(entry.before),
    after: trim(entry.after),
    ip,
    note: entry.note ?? null,
  };
}

export async function audit(entry: AuditEntry, client = supabase()): Promise<void> {
  try {
    const actor = entry.actor === undefined ? await currentActor() : entry.actor;
    const row = buildAuditRow(entry, actor, await clientIp().catch(() => "unknown"));
    const { error } = await client.from("audit_log").insert(row);
    if (error && error.code !== "42P01" && error.code !== "PGRST205") console.error("[audit] write failed:", error.message);
  } catch (err) {
    console.error("[audit] write failed:", err);
  }
}
