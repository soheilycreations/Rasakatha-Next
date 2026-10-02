import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { ADMIN_COOKIE, isValidSession } from "@/lib/server/adminAuth";

// Full order details include the customer's name, phone and address, so this
// lookup-by-id is admin-only. Customers track orders via /api/orders/lookup,
// which also requires the phone number on the order.
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  if (!(await isValidSession(jar.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const { data } = await supabase().from("orders").select("*").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(rowToOrder(data as OrderRow));
}
