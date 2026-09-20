import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(rowToOrder(data as OrderRow));
}
