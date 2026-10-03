import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { requirePermission } from "@/lib/server/guard";

// Full order details include the customer's name, phone and address, so this
// lookup-by-id is admin-only. Customers track orders via /api/orders/lookup,
// which also requires the phone number on the order.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("orders.view");
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: auth.response.status === 403 ? 403 : 401 });
  const { id } = await context.params;
  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(rowToOrder(data as OrderRow));
}
