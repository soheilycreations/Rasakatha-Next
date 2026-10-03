import { supabase } from "./server/supabase";
import { revalidatePath } from "next/cache";
import { slugify } from "./links";
import type { BookLanguage } from "./bookMeta";
import { normalizeText, phoneticKey, tokens } from "./searchText";
import { newestFirst, recommendedOrder, tier } from "./bookOrder";

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
  // null = stock isn't tracked for this book
  stockQty: number | null;
  // optional details (see supabase/book-details.sql)
  isbn: string | null;
  pages: number | null;
  language: BookLanguage | null;
  publishedYear: number | null;
  binding: string | null;
  translator: string | null;
  // real publish date (ISO) and whether it is a Rasakatha title (see supabase/book-order.sql)
  publishedAt: string | null;
  isOwnTitle: boolean;
};

export type { BookLanguage };

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
  stock_qty?: number | null;
  isbn?: string | null;
  pages?: number | null;
  language?: string | null;
  published_year?: number | null;
  binding?: string | null;
  translator?: string | null;
  published_at?: string | null;
  is_own_title?: boolean | null;
};

// Columns added by later migrations. If a migration hasn't been run yet, writes retry without them.
export const OPTIONAL_COLUMNS = ["stock_qty", "isbn", "pages", "language", "published_year", "binding", "translator", "published_at", "is_own_title"] as const;
export function withoutOptionalColumns<T extends Record<string, unknown>>(row: T): Omit<T, (typeof OPTIONAL_COLUMNS)[number]> {
  const copy: Record<string, unknown> = { ...row };
  for (const c of OPTIONAL_COLUMNS) delete copy[c];
  return copy as Omit<T, (typeof OPTIONAL_COLUMNS)[number]>;
}

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
    stockQty: r.stock_qty ?? null,
    isbn: r.isbn ?? null,
    pages: r.pages ?? null,
    language: r.language === "si" || r.language === "en" || r.language === "ta" ? r.language : null,
    publishedYear: r.published_year ?? null,
    binding: r.binding ?? null,
    translator: r.translator ?? null,
    publishedAt: r.published_at ?? null,
    isOwnTitle: !!r.is_own_title,
  };
}

// Card lists never show the blurb — drop it so pages ship less data.
export function forCards(items: CatalogBook[]): CatalogBook[] {
  return items.map((b) => (b.blurb ? { ...b, blurb: "" } : b));
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
    stock_qty: b.stockQty,
    isbn: b.isbn,
    pages: b.pages,
    language: b.language,
    published_year: b.publishedYear,
    binding: b.binding,
    translator: b.translator,
    is_own_title: b.isOwnTitle,
    // published_at is NOT NULL in the database, so only send it when we have one
    ...(b.publishedAt ? { published_at: b.publishedAt } : {}),
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
  // Also refresh the statically cached store pages (home, book, category…).
  try {
    revalidatePath("/", "layout");
  } catch {
    // called outside a request (e.g. a script) — nothing cached to refresh
  }
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

// Customers shouldn't have to page past sold-out titles to find something
// they can buy: in-stock books first, newest first within each group.
export function inStockFirst(items: CatalogBook[]): CatalogBook[] {
  return recommendedOrder(items);
}

const NON_AUTHOR_NAMES = new Set(["Rasakatha Publishers", "Various Authors", "Other"]);

type Indexed = { book: CatalogBook; text: string; key: string; title: string; titleKey: string };
let indexCache: { books: CatalogBook[]; items: Indexed[] } | null = null;

function searchIndex(catalog: CatalogBook[]): Indexed[] {
  if (indexCache?.books === catalog) return indexCache.items;
  const items = catalog.map((book) => {
    const text = normalizeText(`${book.title} ${book.author} ${book.publisher ?? ""}`);
    const title = normalizeText(book.title);
    return { book, text, key: phoneticKey(text), title, titleKey: phoneticKey(title) };
  });
  indexCache = { books: catalog, items };
  return items;
}

// Every word must match (AND). Both halves of "සිංහල | English" titles are searched,
// punctuation is ignored, and Latin words also match phonetically (Singlish spellings).
export async function searchCatalog(query: string): Promise<CatalogBook[]> {
  const qTokens = tokens(query);
  if (qTokens.length === 0) return [];
  const qKeys = qTokens.map(phoneticKey);
  const whole = normalizeText(query);
  const wholeKey = phoneticKey(query);

  const scored: { book: CatalogBook; score: number }[] = [];
  for (const it of searchIndex(await getCatalog())) {
    if (!qTokens.every((t, i) => it.text.includes(t) || it.key.includes(qKeys[i]))) continue;
    let score = 0;
    if (it.title.includes(whole) || it.titleKey.includes(wholeKey)) score += 4;
    if (it.title.startsWith(qTokens[0]) || it.titleKey.startsWith(qKeys[0])) score += 2;
    score += qTokens.filter((t, i) => it.title.includes(t) || it.titleKey.includes(qKeys[i])).length;
    scored.push({ book: it.book, score });
  }
  return scored
    .sort((a, b) => tier(a.book) - tier(b.book) || b.score - a.score || newestFirst(a.book, b.book))
    .map((x) => x.book);
}

export type Suggestions = {
  books: { id: string; title: string; author: string; cover: string | null }[];
  authors: { name: string; count: number }[];
};

export async function getSuggestions(query: string): Promise<Suggestions> {
  const found = await searchCatalog(query);
  const qTokens = tokens(query);
  const qKeys = qTokens.map(phoneticKey);
  const counts = new Map<string, number>();
  for (const b of await getCatalog()) {
    if (!b.author || NON_AUTHOR_NAMES.has(b.author)) continue;
    const text = normalizeText(b.author);
    const key = phoneticKey(text);
    if (qTokens.every((t, i) => text.includes(t) || key.includes(qKeys[i]))) counts.set(b.author, (counts.get(b.author) ?? 0) + 1);
  }
  return {
    books: found.slice(0, 6).map((b) => ({ id: b.id, title: b.title, author: b.author, cover: b.cover })),
    authors: [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count })),
  };
}

export async function getByCategory(category: string): Promise<CatalogBook[]> {
  return inStockFirst((await getCatalog()).filter((b) => b.category === category));
}

export async function getByPublisher(publisher: string): Promise<CatalogBook[]> {
  const q = publisher.toLowerCase();
  return inStockFirst((await getCatalog()).filter((b) => b.publisher?.toLowerCase().includes(q)));
}

export async function getBookById(id: string): Promise<CatalogBook | null> {
  return (await getCatalog()).find((b) => b.id === id) ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<string | null> {
  const decoded = decodeURIComponent(slug);
  const categories = await getCategories();
  const match = categories.find((c) => slugify(c.name) === decoded || c.name === decoded);
  return match?.name ?? null;
}

export async function getByIds(ids: string[]): Promise<CatalogBook[]> {
  const set = new Set(ids);
  return (await getCatalog()).filter((b) => set.has(b.id));
}

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
        books.reduce((sum, b) => sum + (b.rating || 0), 0) / books.length;
      const covers = books.map((b) => b.cover).filter((c): c is string => !!c).slice(0, 3);
      return { name, count: books.length, avgRating, covers };
    })
    .filter((a) => a.count >= 2)
    .sort((a, b) => b.count - a.count || b.avgRating - a.avgRating)
    .slice(0, limit);
}

export async function getByAuthor(name: string): Promise<CatalogBook[]> {
  return inStockFirst((await getCatalog()).filter((b) => b.author === name));
}

export async function getNewest(limit: number): Promise<CatalogBook[]> {
  return [...(await getCatalog())]
    .filter((b) => b.inStock)
    .sort(newestFirst)
    .slice(0, limit);
}

// In-stock Rasakatha titles, newest first.
export async function getOwnTitles(limit?: number): Promise<CatalogBook[]> {
  const items = (await getCatalog()).filter((b) => b.isOwnTitle && b.inStock).sort(newestFirst);
  return limit ? items.slice(0, limit) : items;
}

export async function getOnSale(limit?: number): Promise<CatalogBook[]> {
  const items = (await getCatalog()).filter((b) => b.onSale && b.inStock);
  return limit ? items.slice(0, limit) : items;
}

export type ListOrder = "recommended" | "price_asc" | "price_desc" | "newest";

export function effectivePrice(b: CatalogBook): number {
  return b.onSale && b.salePrice ? b.salePrice : b.regularPrice;
}

export function applyListOptions(items: CatalogBook[], order: string | null, inStockOnly: boolean): CatalogBook[] {
  let out = inStockOnly ? items.filter((b) => b.inStock) : items;
  if (order === "price_asc") out = [...out].sort((a, b) => effectivePrice(a) - effectivePrice(b));
  else if (order === "price_desc") out = [...out].sort((a, b) => effectivePrice(b) - effectivePrice(a));
  else if (order === "newest") out = [...out].sort(newestFirst);
  else out = recommendedOrder(out);
  return out;
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
