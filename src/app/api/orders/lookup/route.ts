import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";

const normalize = (p: string) => p.replace(/\D/g, "").replace(/^94/, "0");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") || "").trim();
  const phone = (searchParams.get("phone") || "").trim();
  if (!id || !phone) {
    return NextResponse.json({ error: "Order ID and phone number are required" }, { status: 400 });
  }

  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  const order = data ? rowToOrder(data as OrderRow) : null;
  const target = normalize(phone);
  const matches =
    order &&
    (normalize(order.customer.phone) === target ||
      (order.customer.giftPhone && normalize(order.customer.giftPhone) === target));

  if (!order || !matches) {
    return NextResponse.json({ error: "No order found with that ID and phone number" }, { status: 404 });
  }
  return NextResponse.json(order);
}
