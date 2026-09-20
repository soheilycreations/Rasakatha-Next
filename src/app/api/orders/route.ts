import { NextResponse } from "next/server";
import { readJson, withFileLock, writeJson } from "@/lib/server/jsonStore";
import type { StoredOrder } from "@/lib/orders";

export async function POST(request: Request) {
  const body = await request.json();
  const { items, subtotal, deliveryFee, total, payment, customer } = body;

  if (!Array.isArray(items) || items.length === 0 || !customer) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const order: StoredOrder = {
    id: Math.floor(10000 + Math.random() * 90000).toString(),
    createdAt: new Date().toISOString(),
    items,
    subtotal,
    deliveryFee,
    total,
    payment,
    status: "processing",
    customer,
  };

  await withFileLock("orders.json", () => {
    const orders = readJson<StoredOrder[]>("orders.json", []);
    orders.unshift(order);
    writeJson("orders.json", orders);
  });

  return NextResponse.json(order);
}
