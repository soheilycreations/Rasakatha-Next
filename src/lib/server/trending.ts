import { supabase } from "./supabase";
import { getByIds, getNewest } from "@/lib/catalog";

const RECENT_DAYS = 14;

type OrderItemsRow = { created_at: string; items: { id: string; qty: number }[] };

export type TrendingBook = { id: string; title: string; author: string; cover: string | null };
export type Trending = { items: TrendingBook[]; basis: "recent" | "all_time" };

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Ranking only: sales quantities are business data and are deliberately never returned.
export async function getTrending(limit: number): Promise<Trending> {
  const { data, error } = await supabase().from("orders").select("created_at, items").gte("created_at", daysAgo(RECENT_DAYS));
  if (error) throw new Error("Trending unavailable");

  const recentQty = new Map<string, number>();
  for (const order of data as OrderItemsRow[]) {
    for (const item of order.items ?? []) {
      recentQty.set(item.id, (recentQty.get(item.id) ?? 0) + item.qty);
    }
  }

  const ranked = [...recentQty.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const chosen = new Set<string>(ranked.slice(0, limit));

  // Pad quiet weeks with all-time bestsellers, then the newest in-stock titles.
  if (chosen.size < limit) {
    const { data: allOrders } = await supabase().from("orders").select("items");
    const allTimeQty = new Map<string, number>();
    for (const order of (allOrders ?? []) as { items: { id: string; qty: number }[] }[]) {
      for (const item of order.items ?? []) {
        allTimeQty.set(item.id, (allTimeQty.get(item.id) ?? 0) + item.qty);
      }
    }
    for (const [id] of [...allTimeQty.entries()].sort((a, b) => b[1] - a[1])) {
      if (chosen.size >= limit) break;
      chosen.add(id);
    }
  }
  if (chosen.size < limit) {
    for (const book of await getNewest(limit * 2)) {
      if (chosen.size >= limit) break;
      chosen.add(book.id);
    }
  }

  const books = await getByIds([...chosen]);
  const byId = new Map(books.map((b) => [b.id, b]));
  const items = [...chosen]
    .map((id) => byId.get(id))
    .filter((b): b is NonNullable<typeof b> => !!b && b.inStock)
    .slice(0, limit)
    .map((b) => ({ id: b.id, title: b.title, author: b.author, cover: b.cover }));

  return { items, basis: recentQty.size > 0 ? "recent" : "all_time" };
}
