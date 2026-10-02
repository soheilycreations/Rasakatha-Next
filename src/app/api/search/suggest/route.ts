import { getSuggestions } from "@/lib/catalog";

const CACHE = { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } };

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ books: [], authors: [] }, CACHE);
  return Response.json(await getSuggestions(q), CACHE);
}
