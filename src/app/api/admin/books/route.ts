import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { bookToRow, invalidateCatalog, rowToBook, withoutOptionalColumns, type BookLanguage, type CatalogBook } from "@/lib/catalog";

// Rasakatha's own imprint, whatever way it was typed.
const OWN_PUBLISHER = /rasa\s*katha/i;
const normalizePublisher = (p: string | null | undefined) => (p && OWN_PUBLISHER.test(p) ? "Rasakatha Publishers" : p || null);

// Normalises the optional detail fields from the admin form.
function cleanDetails(b: Partial<CatalogBook>) {
  const text = (v: unknown, max = 120) => {
    const s = String(v ?? "").trim().slice(0, max);
    return s || null;
  };
  const int = (v: unknown, min: number, max: number) => {
    const n = Math.floor(Number(v));
    return v !== null && v !== "" && v !== undefined && n >= min && n <= max ? n : null;
  };
  return {
    isbn: text(b.isbn, 20),
    pages: int(b.pages, 1, 20000),
    language: (["si", "en", "ta"].includes(String(b.language)) ? b.language : null) as BookLanguage | null,
    publishedYear: int(b.publishedYear, 1400, 2200),
    binding: text(b.binding, 40),
    translator: text(b.translator),
  };
}

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
    publisher: normalizePublisher(body.publisher),
    category: body.category || "Other",
    regularPrice: Number(body.regularPrice) || 0,
    salePrice: body.salePrice != null ? Number(body.salePrice) : null,
    onSale: !!body.onSale,
    inStock: body.inStock !== false,
    rating: Number(body.rating) || 0,
    blurb: body.blurb || "",
    cover: body.cover || null,
    weight: Number(body.weight) || 303,
    stockQty: body.stockQty == null ? null : Math.max(0, Math.floor(Number(body.stockQty)) || 0),
    ...cleanDetails(body),
    // new books are published now; "our title" defaults to whether the publisher is Rasakatha
    publishedAt: new Date().toISOString(),
    isOwnTitle: body.isOwnTitle ?? OWN_PUBLISHER.test(body.publisher ?? ""),
  };

  let { error } = await supabase().from("books").insert(bookToRow(book));
  // stock/detail migrations not run yet: save without the optional columns
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ error } = await supabase().from("books").insert(withoutOptionalColumns(bookToRow(book))));
  }
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

  const merged = { ...rowToBook(existing as Row), ...body, ...cleanDetails({ ...rowToBook(existing as Row), ...body }) };
  merged.publisher = normalizePublisher(merged.publisher);
  // published_at is set once (backfilled or on creation); admin edits never move it
  merged.publishedAt = rowToBook(existing as Row).publishedAt;
  if (merged.stockQty != null) {
    merged.stockQty = Math.max(0, Math.floor(Number(merged.stockQty)) || 0);
    // keep the in-stock flag consistent with a tracked quantity
    merged.inStock = merged.stockQty > 0;
  }
  const { id, ...fields } = bookToRow(merged);
  let { error } = await supabase().from("books").update(fields).eq("id", id);
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    ({ error } = await supabase().from("books").update(withoutOptionalColumns(fields)).eq("id", id));
  }
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
