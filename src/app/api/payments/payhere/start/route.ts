import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { buildPayHereForm } from "@/lib/server/payments";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/server/rateLimit";

// Lets a customer retry payment for an unpaid PayHere order (e.g. after cancelling).
// Authenticated the same way as order lookup: order id + phone number.
export async function POST(request: Request) {
  const limited = await rateLimit(request, "payhere-start", 10, 600);
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "").trim();
  const phone = normalizePhone(String(body?.phone ?? ""));
  if (!id || !phone) return NextResponse.json({ error: "Order ID and phone number are required" }, { status: 400 });

  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  const order = data ? rowToOrder(data as OrderRow) : null;
  if (!order || normalizePhone(order.customer.phone) !== phone) {
    return NextResponse.json({ error: "No order found with that ID and phone number" }, { status: 404 });
  }
  if (order.payment !== "payhere" || order.paymentStatus === "paid") {
    return NextResponse.json({ error: "This order doesn't need a payment." }, { status: 400 });
  }
  const payhere = buildPayHereForm(order);
  if (!payhere) return NextResponse.json({ error: "Online payment is unavailable right now." }, { status: 503 });
  return NextResponse.json({ payhere });
}
