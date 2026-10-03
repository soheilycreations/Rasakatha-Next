// Catalog ordering rules, kept free of server imports so scripts and tests can use them too.

type Orderable = { id: string; inStock: boolean; isOwnTitle?: boolean; publishedAt?: string | null };

// Newest = real publish date; ids only break ties (and cover databases without published_at).
export function newestFirst(a: Orderable, b: Orderable): number {
  const ta = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
  const tb = b.publishedAt ? Date.parse(b.publishedAt) : NaN;
  if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
  return Number(b.id) - Number(a.id);
}

// 0 = in-stock Rasakatha title, 1 = other in-stock book, 2 = out of stock.
export function tier(b: Orderable): number {
  return !b.inStock ? 2 : b.isOwnTitle ? 0 : 1;
}

// "Recommended": Rasakatha titles first, then the rest of what's in stock, sold-out last; newest first within each.
export function recommendedOrder<T extends Orderable>(items: T[]): T[] {
  return [...items].sort((a, b) => tier(a) - tier(b) || newestFirst(a, b));
}
