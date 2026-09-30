import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { normalizePhone } from "@/lib/phone";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { rowToPosSale, type PosSaleRow } from "@/lib/server/posDb";

export type CustomerTransaction = {
  id: string;
  source: "web" | "pos";
  createdAt: string;
  total: number;
  payment: string;
  items: { title: string; qty: number; price: number }[];
};

export async function GET(_request: Request, context: { params: Promise<{ phone: string }> }) {
  const { phone } = await context.params;
  const target = normalizePhone(decodeURIComponent(phone));

  const [ordersRes, posRes] = await Promise.all([
    supabase().from("orders").select("*"),
    supabase().from("pos_sales").select("*"),
  ]);
  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (posRes.error) return NextResponse.json({ error: posRes.error.message }, { status: 500 });

  const orders = (ordersRes.data as OrderRow[])
    .map(rowToOrder)
    .filter((o) => normalizePhone(o.customer.phone) === target);
  const posSales = (posRes.data as PosSaleRow[])
    .map(rowToPosSale)
    .filter((s) => s.customerPhone && normalizePhone(s.customerPhone) === target);

  if (orders.length === 0 && posSales.length === 0) {
    return NextResponse.json({ error: "No customer found for that phone number" }, { status: 404 });
  }

  const transactions: CustomerTransaction[] = [
    ...orders.map((o) => ({
      id: o.id,
      source: "web" as const,
      createdAt: o.createdAt,
      total: o.total,
      payment: o.payment,
      items: o.items.map((i) => ({ title: i.title, qty: i.qty, price: i.price ?? 0 })),
    })),
    ...posSales.map((s) => ({
      id: s.id,
      source: "pos" as const,
      createdAt: s.createdAt,
      total: s.total,
      payment: s.payment,
      items: s.items.map((i) => ({ title: i.title, qty: i.qty, price: i.price })),
    })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const latestWeb = orders[0];
  const latestPos = posSales[0];
  const name = latestWeb?.customer.name || latestPos?.customerName || "";
  const email = latestWeb?.customer.email || latestPos?.customerEmail || "";
  const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0);

  return NextResponse.json({
    phone: target,
    name,
    email,
    totalSpent,
    transactionCount: transactions.length,
    transactions,
  });
}
