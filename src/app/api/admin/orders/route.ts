import { NextResponse, after } from "next/server";
import { audit } from "@/lib/server/audit";
import { parseBody } from "@/lib/server/validate";
import { orderPatchSchema } from "@/lib/schemas/admin";
import { notifyStatusChanged } from "@/lib/server/notify";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { ORDER_STATUS_STEPS, type OrderStatus } from "@/lib/orders";

// Paginated on the server: ?page=1&limit=25&search=...&status=packed
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 25));
  const status = sp.get("status");
  const search = (sp.get("search") ?? "").replace(/[%,()*\\]/g, " ").trim().slice(0, 60);
  const openId = sp.get("open"); // deep link: make sure this order is in the response

  let q = supabase().from("orders").select("*", { count: "exact" });
  if (status && ORDER_STATUS_STEPS.some((s) => s.key === status)) q = q.eq("status", status);
  if (search) q = q.or(`id.ilike.%${search}%,customer->>name.ilike.%${search}%,customer->>phone.ilike.%${search}%`);
  const from = (page - 1) * limit;
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, from + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const total = count ?? 0;
  let items = (data as OrderRow[]).map(rowToOrder);
  if (openId && !items.some((o) => o.id === openId)) {
    const { data: one } = await supabase().from("orders").select("*").eq("id", openId).maybeSingle();
    if (one) items = [rowToOrder(one as OrderRow), ...items];
  }
  return NextResponse.json({ items, total, page, pageCount: Math.max(1, Math.ceil(total / limit)) });
}

export async function PATCH(request: Request) {
  const parsedBody = await parseBody(request, orderPatchSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const { id, status } = parsedBody.data as { id: string; status: OrderStatus };
  if (!ORDER_STATUS_STEPS.some((s) => s.key === status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: before } = await supabase().from("orders").select("status").eq("id", id).maybeSingle();
  const { data, error } = await supabase()
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const order = rowToOrder(data as OrderRow);
  // Tell the customer, but only when the status really changed.
  if (before?.status !== status) after(() => notifyStatusChanged(order));
  await audit({ action: "orders.status", entity: "order", entityId: id, before: { status: before?.status }, after: { status } });
  return NextResponse.json(order);
}
