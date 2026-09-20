import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";

const MAX_ID_ATTEMPTS = 5;

export async function POST(request: Request) {
  const body = await request.json();
  const { items, subtotal, deliveryFee, total, payment, customer } = body;

  if (!Array.isArray(items) || items.length === 0 || !customer) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = Math.floor(10000 + Math.random() * 90000).toString();
    const { data, error } = await supabase()
      .from("orders")
      .insert({
        id,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment,
        status: "processing",
        customer,
      })
      .select()
      .single();

    if (!error) return NextResponse.json(rowToOrder(data as OrderRow));
    // 23505 = unique violation: the random id collided, so try another one.
    if (error.code !== "23505") {
      return NextResponse.json({ error: "Could not place order" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Could not place order" }, { status: 500 });
}
