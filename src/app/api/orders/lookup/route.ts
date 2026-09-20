import { NextResponse } from "next/server";
import { readJson } from "@/lib/server/jsonStore";
import type { StoredOrder } from "@/lib/orders";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") || "").trim();
  const phone = (searchParams.get("phone") || "").trim();
  if (!id || !phone) {
    return NextResponse.json({ error: "Order ID and phone number are required" }, { status: 400 });
  }

  const normalize = (p: string) => p.replace(/\D/g, "").replace(/^94/, "0");
  const target = normalize(phone);

  const orders = readJson<StoredOrder[]>("orders.json", []);
  const order = orders.find(
    (o) =>
      o.id === id &&
      (normalize(o.customer.phone) === target || (o.customer.giftPhone && normalize(o.customer.giftPhone) === target))
  );
  if (!order) {
    return NextResponse.json({ error: "No order found with that ID and phone number" }, { status: 404 });
  }
  return NextResponse.json(order);
}
