import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { bookToRow, invalidateCatalog, rowToBook, type CatalogBook } from "@/lib/catalog";

type Row = Parameters<typeof rowToBook>[0];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Number(searchParams.get("limit") || "25")) || 25;
  const from = (page - 1) * limit;

  let query = supabase().from("books").select("*", { count: "exact" });
  if (search) {
    // Strip characters that would break PostgREST's or() filter syntax.
    const term = search.replace(/[,()%*\\]/g, " ");
    query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%,id.eq.${term}`);
  }
  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({
    items: (data as Row[]).map(rowToBook),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CatalogBook>;
  const book: CatalogBook = {
    id: body.id?.trim() || Date.now().toString(),
    title: body.title || "Untitled",
    author: body.author || "Unknown Author",
    publisher: body.publisher || null,
    category: body.category || "Other",
    regularPrice: Number(body.regularPrice) || 0,
    salePrice: body.salePrice != null ? Number(body.salePrice) : null,
    onSale: !!body.onSale,
    inStock: body.inStock !== false,
    rating: Number(body.rating) || 0,
    blurb: body.blurb || "",
    cover: body.cover || null,
    weight: Number(body.weight) || 303,
  };

  const { error } = await supabase().from("books").insert(bookToRow(book));
  if (error) {
    const dup = error.code === "23505";
    return NextResponse.json(
      { error: dup ? "A book with this ID already exists" : error.message },
      { status: dup ? 409 : 500 }
    );
  }
  invalidateCatalog();
  return NextResponse.json(book);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as CatalogBook;
  const { data: existing } = await supabase().from("books").select("*").eq("id", body.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const merged = { ...rowToBook(existing as Row), ...body };
  const { id, ...fields } = bookToRow(merged);
  const { error } = await supabase().from("books").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCatalog();
  return NextResponse.json(merged);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase().from("books").delete().eq("id", id).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  invalidateCatalog();
  return NextResponse.json({ ok: true });
}
