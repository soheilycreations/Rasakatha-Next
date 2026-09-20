import raw from "./data/catalog.json";
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

export const CATALOG = raw as CatalogBook[];

export function getCategories(): { name: string; count: number; covers: string[] }[] {
  const counts = new Map<string, number>();
  const covers = new Map<string, string[]>();
  for (const b of CATALOG) {
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

export function searchCatalog(query: string): CatalogBook[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CATALOG.filter(
    (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
}

export function getByCategory(category: string): CatalogBook[] {
  return CATALOG.filter((b) => b.category === category);
}

export function getByPublisher(publisher: string): CatalogBook[] {
  const q = publisher.toLowerCase();
  return CATALOG.filter((b) => b.publisher?.toLowerCase().includes(q));
}

export function getByIds(ids: string[]): CatalogBook[] {
  const set = new Set(ids);
  return CATALOG.filter((b) => set.has(b.id));
}

const NON_AUTHOR_NAMES = new Set(["Rasakatha Publishers", "Various Authors", "Other"]);

export type AuthorSummary = { name: string; count: number; avgRating: number; covers: string[] };

export function getTopAuthors(limit: number): AuthorSummary[] {
  const byAuthor = new Map<string, CatalogBook[]>();
  for (const b of CATALOG) {
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

export function getByAuthor(name: string): CatalogBook[] {
  return CATALOG.filter((b) => b.author === name);
}

export function getNewest(limit: number): CatalogBook[] {
  return [...CATALOG].filter((b) => b.inStock).sort((a, b) => Number(b.id) - Number(a.id)).slice(0, limit);
}

export function getOnSale(limit?: number): CatalogBook[] {
  const items = CATALOG.filter((b) => b.onSale && b.inStock);
  return limit ? items.slice(0, limit) : items;
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page: safePage,
    pageCount,
  };
}
