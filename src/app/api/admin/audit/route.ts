import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/guard";
import { supabase } from "@/lib/server/supabase";
import { auditQuerySchema } from "@/lib/schemas/admin";

// Audit viewer API: filter by user, entity and date; paginated on the server.
export async function GET(request: Request) {
  const auth = await requirePermission("audit.view");
  if (!auth.ok) return auth.response;
  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = auditQuerySchema.safeParse(sp);
  if (!parsed.success) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  const { actor, entity, from, to, page, limit } = parsed.data;

  let q = supabase().from("audit_log").select("*", { count: "exact" });
  if (actor) q = q.ilike("actor_name", `%${actor.replace(/[%,()*\\]/g, " ")}%`);
  if (entity) q = q.eq("entity", entity);
  if (from) q = q.gte("at", from);
  if (to) q = q.lte("at", to.length <= 10 ? `${to}T23:59:59.999Z` : to);
  const start = (page - 1) * limit;
  const { data, count, error } = await q.order("at", { ascending: false }).range(start, start + limit - 1);
  if (error) {
    const missing = error.code === "PGRST205" || error.code === "42P01";
    return NextResponse.json({ items: [], total: 0, page, pageCount: 1, tableMissing: missing }, { status: missing ? 200 : 500 });
  }
  const total = count ?? 0;
  return NextResponse.json({ items: data, total, page, pageCount: Math.max(1, Math.ceil(total / limit)) });
}
