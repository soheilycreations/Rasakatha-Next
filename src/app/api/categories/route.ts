import { getCategories } from "@/lib/catalog";

export async function GET() {
  return Response.json(await getCategories(), { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=900" } });
}
