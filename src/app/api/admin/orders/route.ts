import { NextResponse, after } from "next/server";
import { notifyStatusChanged } from "@/lib/server/notify";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { ORDER_STATUS_STEPS, type OrderStatus } from "@/lib/orders";

export async function GET() {
  const { data, error } = await supabase()
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as OrderRow[]).map(rowToOrder));
}

export async function PATCH(request: Request) {
  const { id, status } = (await request.json()) as { id: string; status: OrderStatus };
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
  return NextResponse.json(order);
}
