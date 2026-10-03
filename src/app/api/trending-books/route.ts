import { NextResponse } from "next/server";
import { getTrending } from "@/lib/server/trending";

// Public endpoint: returns the ranking only (see getTrending).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(20, Number(searchParams.get("limit") || "10")) || 10;
  try {
    return NextResponse.json(await getTrending(limit), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
