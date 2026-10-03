import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { audit } from "@/lib/server/audit";
import { parseBody } from "@/lib/server/validate";
import { archiveBookSchema, bookInputSchema } from "@/lib/schemas/admin";
import { newestFirst } from "@/lib/bookOrder";
import { bookToRow, getCatalog, invalidateCatalog, paginate, rowToBook, withoutOptionalColumns, type BookLanguage, type CatalogBook } from "@/lib/catalog";

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

const missingDescription = (b: CatalogBook) => !b.blurb?.trim();
const missingPublisher = (b: CatalogBook) => !b.publisher?.trim();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Number(searchParams.get("limit") || "25")) || 25;
  const from = (page - 1) * limit;
  const filter = searchParams.get("filter");

  // "Missing description" / "Missing publisher" lists: Rasakatha titles first, then newest first.
  const catalog = await getCatalog();
  const counts = {
    missingDescription: catalog.filter(missingDescription).length,
    missingPublisher: catalog.filter(missingPublisher).length,
  };
  if (filter === "missing_description" || filter === "missing_publisher") {
    const test = filter === "missing_description" ? missingDescription : missingPublisher;
    const q = search.toLowerCase();
    const list = catalog
      .filter(test)
      .filter((b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.id === q)
      .sort((a, b) => Number(b.isOwnTitle) - Number(a.isOwnTitle) || newestFirst(a, b));
    const p = paginate(list, page, limit);
    return NextResponse.json({ items: p.items, total: p.total, page: p.page, pageCount: p.pageCount, counts });
  }

  const archivedOnly = filter === "archived";
  // strip characters that would break PostgREST's or() filter syntax
  const term = search.replace(/[,()%*\\]/g, " ");
  const run = (withArchiveColumn: boolean) => {
    let q = supabase().from("books").select("*", { count: "exact" });
    if (withArchiveColumn) q = archivedOnly ? q.not("archived_at", "is", null) : q.is("archived_at", null);
    if (search) q = q.or(`title.ilike.%${term}%,author.ilike.%${term}%,isbn.ilike.%${term}%,id.eq.${term}`);
    return q.order("created_at", { ascending: false }).order("id").range(from, from + limit - 1);
  };
  let { data, count, error } = await run(true);
  // supabase/admin-phase-0.sql (the archived_at column) hasn't been run yet: list everything, archive is unavailable
  if (error && (error.code === "42703" || error.code === "PGRST204")) {
    if (archivedOnly) return NextResponse.json({ items: [], total: 0, page, pageCount: 1, counts });
    ({ data, count, error } = await run(false));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  return NextResponse.json({
    items: (data as Row[]).map(rowToBook),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / limit)),
    counts,
  });
}

export async function POST(request: Request) {
  const parsedBody = await parseBody(request, bookInputSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data as Partial<CatalogBook>;
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
  await audit({ action: "books.create", entity: "book", entityId: book.id, after: { ...book, blurb: undefined } });
  return NextResponse.json(book);
}

export async function PUT(request: Request) {
  const parsedBody = await parseBody(request, bookInputSchema);
  if (!parsedBody.ok) return parsedBody.response;
  if (!parsedBody.data.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const body = parsedBody.data as unknown as CatalogBook;
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
  await audit({
    action: "books.update",
    entity: "book",
    entityId: merged.id,
    before: { ...rowToBook(existing as Row), blurb: undefined },
    after: { ...merged, blurb: undefined },
    note: rowToBook(existing as Row).blurb !== merged.blurb ? "description changed" : undefined,
  });
  return NextResponse.json(merged);
}

// Never hard-delete business data: "delete" archives the book (hidden from the store, kept with its reason).
export async function DELETE(request: Request) {
  const sp = new URL(request.url).searchParams;
  const parsed = archiveBookSchema.safeParse({ id: sp.get("id") ?? "", reason: sp.get("reason") ?? "" });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Missing id or reason" }, { status: 400 });

  const { data: before } = await supabase().from("books").select("*").eq("id", parsed.data.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  const { error } = await supabase().from("books").update({ archived_at: new Date().toISOString(), archive_reason: parsed.data.reason }).eq("id", parsed.data.id);
  if (error) {
    const missing = error.code === "42703" || error.code === "PGRST204";
    return NextResponse.json({ error: missing ? "Archiving needs supabase/admin-phase-0.sql to be run." : error.message }, { status: missing ? 503 : 500 });
  }
  invalidateCatalog();
  await audit({ action: "books.archive", entity: "book", entityId: parsed.data.id, before: { ...rowToBook(before as Row), blurb: undefined }, note: parsed.data.reason });
  return NextResponse.json({ ok: true });
}

// Restore an archived book.
export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabase().from("books").update({ archived_at: null, archive_reason: null }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidateCatalog();
  await audit({ action: "books.restore", entity: "book", entityId: body.id });
  return NextResponse.json({ ok: true });
}
