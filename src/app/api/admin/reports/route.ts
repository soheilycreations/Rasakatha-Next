import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";

type OrderRow = { created_at: string; total: number; items: { id: string; title: string; price: number; qty: number }[] };
type PosRow = { created_at: string; total: number; items: { id: string; title: string; price: number; qty: number }[] };

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "monthly" ? "monthly" : "daily";
  const spanDays = period === "daily" ? 30 : 365;

  const since = daysAgoIso(spanDays);
  const [ordersRes, posRes] = await Promise.all([
    supabase().from("orders").select("created_at, total, items").gte("created_at", since),
    supabase().from("pos_sales").select("created_at, total, items").gte("created_at", since),
  ]);
  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (posRes.error) return NextResponse.json({ error: posRes.error.message }, { status: 500 });

  const orders = ordersRes.data as OrderRow[];
  const posSales = posRes.data as PosRow[];
  const keyOf = period === "daily" ? dayKey : monthKey;

  type Bucket = { key: string; label: string; webRevenue: number; posRevenue: number; webOrders: number; posSales: number };
  const buckets = new Map<string, Bucket>();

  const bucketCount = period === "daily" ? 30 : 12;
  const today = new Date();
  for (let i = bucketCount - 1; i >= 0; i--) {
    const d = new Date(today);
    if (period === "daily") {
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, {
        key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        webRevenue: 0,
        posRevenue: 0,
        webOrders: 0,
        posSales: 0,
      });
    } else {
      // Set the day to 1 first — otherwise subtracting months from e.g. the
      // 30th or 31st overflows into the next month once it lands on a
      // shorter month (Feb), silently skipping and duplicating buckets.
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      buckets.set(key, {
        key,
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        webRevenue: 0,
        posRevenue: 0,
        webOrders: 0,
        posSales: 0,
      });
    }
  }

  const productMovement = new Map<string, { title: string; qty: number; revenue: number }>();
  const addMovement = (items: OrderRow["items"]) => {
    for (const item of items ?? []) {
      const entry = productMovement.get(item.id) || { title: item.title, qty: 0, revenue: 0 };
      entry.qty += item.qty;
      entry.revenue += item.price * item.qty;
      productMovement.set(item.id, entry);
    }
  };

  for (const o of orders) {
    const key = keyOf(o.created_at);
    const b = buckets.get(key);
    if (b) {
      b.webRevenue += Number(o.total);
      b.webOrders += 1;
    }
    addMovement(o.items);
  }
  for (const s of posSales) {
    const key = keyOf(s.created_at);
    const b = buckets.get(key);
    if (b) {
      b.posRevenue += Number(s.total);
      b.posSales += 1;
    }
    addMovement(s.items);
  }

  const series = [...buckets.values()].map((b) => ({ ...b, totalRevenue: b.webRevenue + b.posRevenue }));
  const totals = series.reduce(
    (acc, b) => ({
      webRevenue: acc.webRevenue + b.webRevenue,
      posRevenue: acc.posRevenue + b.posRevenue,
      webOrders: acc.webOrders + b.webOrders,
      posSales: acc.posSales + b.posSales,
    }),
    { webRevenue: 0, posRevenue: 0, webOrders: 0, posSales: 0 }
  );

  const topProducts = [...productMovement.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return NextResponse.json({
    period,
    series,
    totals: { ...totals, totalRevenue: totals.webRevenue + totals.posRevenue },
    productMovement: topProducts,
  });
}
