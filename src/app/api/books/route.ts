import {
  getCatalog,
  getByAuthor,
  getByCategory,
  getByIds,
  getByPublisher,
  getNewest,
  getOnSale,
  applyListOptions,
  paginate,
  searchCatalog,
} from "@/lib/catalog";

// Catalog responses are public and identical for everyone, so let Vercel's
// CDN serve them instead of hitting Supabase on every page view.
const CACHE = { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=900" } };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const publisher = searchParams.get("publisher");
  const author = searchParams.get("author");
  const search = searchParams.get("search");
  const ids = searchParams.get("ids");
  const sort = searchParams.get("sort");
  const page = Number(searchParams.get("page") || "1");
  const limit = Math.min(60, Number(searchParams.get("limit") || "24")) || 24;

  if (ids) {
    const list = await getByIds(ids.split(",").filter(Boolean));
    return Response.json({ items: list, total: list.length, page: 1, pageCount: 1 }, CACHE);
  }

  if (sort === "new") {
    const items = await getNewest(limit);
    return Response.json({ items, total: items.length, page: 1, pageCount: 1 }, CACHE);
  }

  let items: Awaited<ReturnType<typeof getCatalog>>;
  if (search) items = await searchCatalog(search);
  else if (author) items = await getByAuthor(author);
  else if (publisher) items = await getByPublisher(publisher);
  else if (category === "__sale__") items = await getOnSale();
  else if (category) items = await getByCategory(category);
  else items = await getCatalog();

  items = applyListOptions(items, searchParams.get("order"), searchParams.get("instock") === "1");
  return Response.json(paginate(items, page, limit), CACHE);
}
