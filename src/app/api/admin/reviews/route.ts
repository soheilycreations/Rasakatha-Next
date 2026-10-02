import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getCatalog } from "@/lib/catalog";
import { syncBookRating } from "@/lib/server/reviews";

// Admin only: /api/admin/* is gated by src/proxy.ts.
type Row = { id: string; book_id: string; name: string; rating: number; text: string; approved: boolean; created_at: string };

export async function GET() {
  const { data, error } = await supabase()
    .from("reviews")
    .select("id, book_id, name, rating, text, approved, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  // 42P01 = table missing (supabase/reviews.sql not run yet)
  if (error) return NextResponse.json({ items: [], tableMissing: error.code === "42P01" || /does not exist|schema cache/i.test(error.message) });

  const titles = new Map((await getCatalog()).map((b) => [b.id, b.title]));
  return NextResponse.json({
    items: (data as Row[]).map((r) => ({
      id: r.id,
      bookId: r.book_id,
      bookTitle: titles.get(r.book_id) ?? r.book_id,
      name: r.name,
      rating: r.rating,
      text: r.text,
      approved: r.approved,
      createdAt: r.created_at,
    })),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id || typeof body?.approved !== "boolean") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { data, error } = await supabase().from("reviews").update({ approved: body.approved }).eq("id", id).select("book_id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  await syncBookRating(data.book_id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data, error } = await supabase().from("reviews").delete().eq("id", id).select("book_id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) await syncBookRating(data.book_id);
  return NextResponse.json({ ok: true });
}
