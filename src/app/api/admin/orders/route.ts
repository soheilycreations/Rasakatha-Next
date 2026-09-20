import { NextResponse } from "next/server";
import { readJson, withFileLock, writeJson } from "@/lib/server/jsonStore";
import type { OrderStatus, StoredOrder } from "@/lib/orders";

export async function GET() {
  const orders = readJson<StoredOrder[]>("orders.json", []);
  return NextResponse.json(orders);
}

export async function PATCH(request: Request) {
  const { id, status } = (await request.json()) as { id: string; status: OrderStatus };

  const result = await withFileLock("orders.json", () => {
    const orders = readJson<StoredOrder[]>("orders.json", []);
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], status };
    writeJson("orders.json", orders);
    return orders[idx];
  });

  if (!result) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(result);
}
