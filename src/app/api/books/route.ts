import {
  getCatalog,
  getByAuthor,
  getByCategory,
  getByIds,
  getByPublisher,
  getNewest,
  getOnSale,
  paginate,
  searchCatalog,
} from "@/lib/catalog";

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
    return Response.json({ items: list, total: list.length, page: 1, pageCount: 1 });
  }

  if (sort === "new") {
    const items = await getNewest(limit);
    return Response.json({ items, total: items.length, page: 1, pageCount: 1 });
  }

  let items;
  if (search) items = await searchCatalog(search);
  else if (author) items = await getByAuthor(author);
  else if (publisher) items = await getByPublisher(publisher);
  else if (category === "__sale__") items = await getOnSale();
  else if (category) items = await getByCategory(category);
  else items = await getCatalog();

  return Response.json(paginate(items, page, limit));
}
