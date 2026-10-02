import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { currentAccount } from "@/lib/server/customerAuth";
import { getBookById, invalidateCatalog } from "@/lib/catalog";

type ReviewRow = {
  id: string;
  book_id: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

function toReview(r: ReviewRow) {
  return { id: r.id, name: r.name, rating: r.rating, text: r.text, createdAt: r.created_at };
}

export async function GET(request: Request) {
  const bookId = new URL(request.url).searchParams.get("book")?.trim();
  if (!bookId) return NextResponse.json({ items: [] });

  const { data, error } = await supabase()
    .from("reviews")
    .select("id, book_id, name, rating, text, created_at")
    .eq("book_id", bookId)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(100);

  // Table not created yet (see supabase/schema.sql) — just show no reviews.
  if (error) return NextResponse.json({ items: [] });
  return NextResponse.json(
    { items: (data as ReviewRow[]).map(toReview) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } }
  );
}

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return NextResponse.json({ error: "Please sign in to post a review." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const bookId = String(body?.bookId ?? "").trim();
  const rating = Math.round(Number(body?.rating));
  const text = String(body?.text ?? "").trim().slice(0, 2000);

  if (!bookId || !(await getBookById(bookId))) {
    return NextResponse.json({ error: "Book not found." }, { status: 404 });
  }
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  if (text.length < 3) return NextResponse.json({ error: "Please write a few words about the book." }, { status: 400 });

  const name = (account.name || account.email.split("@")[0] || "Reader").slice(0, 60);

  // One review per customer per book — posting again updates it.
  const { data, error } = await supabase()
    .from("reviews")
    .upsert(
      { book_id: bookId, user_id: account.id, name, rating, text, approved: true },
      { onConflict: "book_id,user_id" }
    )
    .select("id, book_id, name, rating, text, created_at")
    .single();
  if (error) return NextResponse.json({ error: "Couldn't post your review. Please try again." }, { status: 500 });

  // Keep the book's star rating in sync with real reviews.
  const { data: all } = await supabase().from("reviews").select("rating").eq("book_id", bookId).eq("approved", true);
  if (all && all.length > 0) {
    const avg = all.reduce((s, r) => s + Number(r.rating), 0) / all.length;
    await supabase().from("books").update({ rating: Math.round(avg * 100) / 100 }).eq("id", bookId);
    invalidateCatalog();
  }

  return NextResponse.json(toReview(data as ReviewRow));
}
