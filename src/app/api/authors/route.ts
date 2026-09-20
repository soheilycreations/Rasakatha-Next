import { getTopAuthors } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Number(searchParams.get("limit") || "10")) || 10;
  return Response.json(await getTopAuthors(limit));
}
