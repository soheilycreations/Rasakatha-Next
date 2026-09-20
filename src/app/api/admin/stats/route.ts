import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { getCatalog } from "@/lib/catalog";

function dateKey(iso: string) {
  return iso.slice(0, 10);
}

export async function GET() {
  const { data, error } = await supabase().from("orders").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orders = (data as OrderRow[]).map(rowToOrder);
  const CATALOG = await getCatalog();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const today = new Date();
  const days: { date: string; label: string; revenue: number; orders: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayOrders = orders.filter((o) => dateKey(o.createdAt) === key);
    days.push({
      date: key,
      label,
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      orders: dayOrders.length,
    });
  }

  const paymentBreakdown = new Map<string, number>();
  for (const o of orders) {
    paymentBreakdown.set(o.payment, (paymentBreakdown.get(o.payment) || 0) + 1);
  }

  const bookById = new Map(CATALOG.map((b) => [b.id, b]));
  const salesByBook = new Map<string, { title: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const entry = salesByBook.get(item.id) || {
        title: bookById.get(item.id)?.title ?? item.title,
        qty: 0,
        revenue: 0,
      };
      entry.qty += item.qty;
      entry.revenue += (item.price ?? 0) * item.qty;
      salesByBook.set(item.id, entry);
    }
  }
  const topBooks = [...salesByBook.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const last7 = days.slice(-7);
  const prev7 = days.slice(-14, -7);
  const revenue7d = last7.reduce((s, d) => s + d.revenue, 0);
  const revenuePrev7d = prev7.reduce((s, d) => s + d.revenue, 0);
  const growthPct = revenuePrev7d > 0 ? ((revenue7d - revenuePrev7d) / revenuePrev7d) * 100 : revenue7d > 0 ? 100 : 0;

  return NextResponse.json({
    totalRevenue,
    totalOrders,
    avgOrderValue,
    revenue7d,
    growthPct,
    daily: days,
    paymentBreakdown: [...paymentBreakdown.entries()].map(([method, count]) => ({ method, count })),
    topBooks,
  });
}
