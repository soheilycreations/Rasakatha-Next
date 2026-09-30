import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getByIds } from "@/lib/catalog";

const RECENT_DAYS = 7;
const PREVIOUS_DAYS = 7;

type OrderItemsRow = { created_at: string; items: { id: string; qty: number }[] };

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(20, Number(searchParams.get("limit") || "8")) || 8;

  const since = daysAgo(RECENT_DAYS + PREVIOUS_DAYS);
  const { data, error } = await supabase()
    .from("orders")
    .select("created_at, items")
    .gte("created_at", since);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recentCutoff = daysAgo(RECENT_DAYS);
  const recentQty = new Map<string, number>();
  const previousQty = new Map<string, number>();

  for (const order of data as OrderItemsRow[]) {
    const bucket = order.created_at >= recentCutoff ? recentQty : previousQty;
    for (const item of order.items ?? []) {
      bucket.set(item.id, (bucket.get(item.id) ?? 0) + item.qty);
    }
  }

  // A brand-new store has no sales history yet — fall back to all-time qty so
  // the section isn't just empty, but be honest about it via `basis`.
  let ranked = [...recentQty.entries()].sort((a, b) => b[1] - a[1]);
  let basis: "recent" | "all_time" = "recent";
  if (ranked.length === 0) {
    const { data: allOrders, error: allError } = await supabase().from("orders").select("items");
    if (allError) return NextResponse.json({ error: allError.message }, { status: 500 });
    const allTimeQty = new Map<string, number>();
    for (const order of allOrders as { items: { id: string; qty: number }[] }[]) {
      for (const item of order.items ?? []) {
        allTimeQty.set(item.id, (allTimeQty.get(item.id) ?? 0) + item.qty);
      }
    }
    ranked = [...allTimeQty.entries()].sort((a, b) => b[1] - a[1]);
    basis = "all_time";
  }

  const top = ranked.slice(0, limit);
  const books = await getByIds(top.map(([id]) => id));
  const bookById = new Map(books.map((b) => [b.id, b]));

  const items = top
    .map(([id, qty]) => {
      const book = bookById.get(id);
      if (!book) return null;
      const prev = previousQty.get(id) ?? 0;
      const trend: "up" | "down" | "flat" = basis === "all_time" || qty === prev ? "flat" : qty > prev ? "up" : "down";
      const changePct = prev > 0 ? Math.round(((qty - prev) / prev) * 100) : qty > 0 ? 100 : 0;
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        cover: book.cover,
        qtySold: qty,
        trend,
        changePct,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ items, basis });
}
