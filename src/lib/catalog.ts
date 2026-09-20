import { supabase } from "./server/supabase";
import { displayRating } from "./format";

export type CatalogBook = {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  category: string;
  regularPrice: number;
  salePrice: number | null;
  onSale: boolean;
  inStock: boolean;
  rating: number;
  blurb: string;
  cover: string | null;
  weight: number;
};

type BookRow = {
  id: string;
  title: string;
  author: string;
  publisher: string | null;
  category: string;
  regular_price: number;
  sale_price: number | null;
  on_sale: boolean;
  in_stock: boolean;
  rating: number;
  blurb: string;
  cover: string | null;
  weight: number;
};

export function rowToBook(r: BookRow): CatalogBook {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    publisher: r.publisher,
    category: r.category,
    regularPrice: Number(r.regular_price),
    salePrice: r.sale_price == null ? null : Number(r.sale_price),
    onSale: r.on_sale,
    inStock: r.in_stock,
    rating: Number(r.rating),
    blurb: r.blurb,
    cover: r.cover,
    weight: r.weight,
  };
}

export function bookToRow(b: CatalogBook): BookRow {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    category: b.category,
    regular_price: b.regularPrice,
    sale_price: b.salePrice,
    on_sale: b.onSale,
    in_stock: b.inStock,
    rating: b.rating,
    blurb: b.blurb,
    cover: b.cover,
    weight: b.weight,
  };
}

// The catalog is small (~1.5k rows), so it's cached in memory per server
// instance and filtered in JS. Admin writes call invalidateCatalog().
const CACHE_TTL_MS = 30_000;
const PAGE = 1000;
let cache: { at: number; books: CatalogBook[] } | null = null;
let inflight: Promise<CatalogBook[]> | null = null;

export function invalidateCatalog() {
  cache = null;
}

async function fetchAll(): Promise<CatalogBook[]> {
  const all: CatalogBook[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase()
      .from("books")
      .select("*")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to load catalog: ${error.message}`);
    all.push(...(data as BookRow[]).map(rowToBook));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

export async function getCatalog(): Promise<CatalogBook[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.books;
  if (!inflight) {
    inflight = fetchAll()
      .then((books) => {
        cache = { at: Date.now(), books };
        return books;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function getCategories(): Promise<{ name: string; count: number; covers: string[] }[]> {
  const catalog = await getCatalog();
  const counts = new Map<string, number>();
  const covers = new Map<string, string[]>();
  for (const b of catalog) {
    counts.set(b.category, (counts.get(b.category) || 0) + 1);
    if (b.cover) {
      const list = covers.get(b.category) || [];
      if (list.length < 3) {
        list.push(b.cover);
        covers.set(b.category, list);
      }
    }
  }
  return [...counts.entries()]
    .filter(([name]) => name !== "Other")
    .map(([name, count]) => ({ name, count, covers: covers.get(name) || [] }))
    .sort((a, b) => b.count - a.count);
}

export async function searchCatalog(query: string): Promise<CatalogBook[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const catalog = await getCatalog();
  return catalog.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
}

export async function getByCategory(category: string): Promise<CatalogBook[]> {
  return (await getCatalog()).filter((b) => b.category === category);
}

export async function getByPublisher(publisher: string): Promise<CatalogBook[]> {
  const q = publisher.toLowerCase();
  return (await getCatalog()).filter((b) => b.publisher?.toLowerCase().includes(q));
}

export async function getByIds(ids: string[]): Promise<CatalogBook[]> {
  const set = new Set(ids);
  return (await getCatalog()).filter((b) => set.has(b.id));
}

const NON_AUTHOR_NAMES = new Set(["Rasakatha Publishers", "Various Authors", "Other"]);

export type AuthorSummary = { name: string; count: number; avgRating: number; covers: string[] };

export async function getTopAuthors(limit: number): Promise<AuthorSummary[]> {
  const byAuthor = new Map<string, CatalogBook[]>();
  for (const b of await getCatalog()) {
    if (!b.author || NON_AUTHOR_NAMES.has(b.author)) continue;
    const list = byAuthor.get(b.author) || [];
    list.push(b);
    byAuthor.set(b.author, list);
  }

  return [...byAuthor.entries()]
    .map(([name, books]) => {
      const avgRating =
        books.reduce((sum, b) => sum + displayRating(b.id, b.rating), 0) / books.length;
      const covers = books.map((b) => b.cover).filter((c): c is string => !!c).slice(0, 3);
      return { name, count: books.length, avgRating, covers };
    })
    .filter((a) => a.count >= 2)
    .sort((a, b) => b.count - a.count || b.avgRating - a.avgRating)
    .slice(0, limit);
}

export async function getByAuthor(name: string): Promise<CatalogBook[]> {
  return (await getCatalog()).filter((b) => b.author === name);
}

export async function getNewest(limit: number): Promise<CatalogBook[]> {
  return [...(await getCatalog())]
    .filter((b) => b.inStock)
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, limit);
}

export async function getOnSale(limit?: number): Promise<CatalogBook[]> {
  const items = (await getCatalog()).filter((b) => b.onSale && b.inStock);
  return limit ? items.slice(0, limit) : items;
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, Number.isFinite(page) ? page : 1), pageCount);
  const start = (safePage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page: safePage,
    pageCount,
  };
}
