import { NextResponse } from "next/server";
import { readJson } from "@/lib/server/jsonStore";
import type { StoredOrder } from "@/lib/orders";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const orders = readJson<StoredOrder[]>("orders.json", []);
  const order = orders.find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}
