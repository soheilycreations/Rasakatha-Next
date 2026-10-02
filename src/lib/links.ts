// URL helpers shared by server pages and client components. Keep this file
// free of server-only imports.

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Book titles are usually "සිංහල | English" — the Latin half makes the slug.
export function bookHref(book: { id: string; title: string }): string {
  const slug = slugify(book.title);
  return slug ? `/book/${book.id}-${slug}` : `/book/${book.id}`;
}

// "/book/38449-mai-wahi" -> "38449"; also accepts a bare id.
export function bookIdFromParam(param: string): string {
  const decoded = decodeURIComponent(param);
  const match = decoded.match(/^(\d+)/);
  return match ? match[1] : decoded;
}

export function categoryHref(name: string): string {
  return `/category/${slugify(name) || encodeURIComponent(name)}`;
}

export function authorHref(name: string): string {
  return `/author/${encodeURIComponent(name)}`;
}

export const ROUTES = {
  home: "/",
  categories: "/categories",
  library: "/library",
  cart: "/cart",
  checkout: "/checkout",
  thankYou: "/thank-you",
  track: "/track-order",
  account: "/account",
  sale: "/sale",
  newArrivals: "/new-arrivals",
  about: "/about",
  contact: "/contact",
  delivery: "/delivery-returns",
  help: "/help",
  search: "/search",
} as const;
