import { NextResponse } from "next/server";
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

  const { data, error } = await supabase()
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(rowToOrder(data as OrderRow));
}
