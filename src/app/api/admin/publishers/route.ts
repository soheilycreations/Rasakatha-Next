import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export async function GET() {
  const catalog = await getCatalog();
  const names = [...new Set(catalog.map((b) => b.publisher).filter((p): p is string => !!p?.trim()))].sort((a, b) =>
    a.localeCompare(b)
  );
  return NextResponse.json(names);
}
