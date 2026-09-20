import { NextResponse } from "next/server";
import { readJson, withFileLock, writeJson } from "@/lib/server/jsonStore";
import type { CatalogBook } from "@/lib/catalog";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim().toLowerCase();
  const page = Number(searchParams.get("page") || "1");
  const limit = Math.min(100, Number(searchParams.get("limit") || "25")) || 25;

  const books = readJson<CatalogBook[]>("catalog.json", []);
  const filtered = search
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.author.toLowerCase().includes(search) ||
          b.id.includes(search)
      )
    : books;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, Number.isFinite(page) ? page : 1), pageCount);
  const start = (safePage - 1) * limit;

  return NextResponse.json({
    items: filtered.slice(start, start + limit),
    total,
    page: safePage,
    pageCount,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CatalogBook>;

  const result = await withFileLock("catalog.json", () => {
    const books = readJson<CatalogBook[]>("catalog.json", []);
    const id = body.id?.trim() || Date.now().toString();
    if (books.some((b) => b.id === id)) {
      return { error: "A book with this ID already exists" as const };
    }

    const book: CatalogBook = {
      id,
      title: body.title || "Untitled",
      author: body.author || "Unknown Author",
      publisher: body.publisher ?? null,
      category: body.category || "Other",
      regularPrice: Number(body.regularPrice) || 0,
      salePrice: body.salePrice != null ? Number(body.salePrice) : null,
      onSale: !!body.onSale,
      inStock: body.inStock !== false,
      rating: Number(body.rating) || 0,
      blurb: body.blurb || "",
      cover: body.cover ?? null,
      weight: Number(body.weight) || 303,
    };
    books.unshift(book);
    writeJson("catalog.json", books);
    return { book };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json(result.book);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as CatalogBook;

  const result = await withFileLock("catalog.json", () => {
    const books = readJson<CatalogBook[]>("catalog.json", []);
    const idx = books.findIndex((b) => b.id === body.id);
    if (idx === -1) return null;
    books[idx] = { ...books[idx], ...body };
    writeJson("catalog.json", books);
    return books[idx];
  });

  if (!result) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const found = await withFileLock("catalog.json", () => {
    const books = readJson<CatalogBook[]>("catalog.json", []);
    const next = books.filter((b) => b.id !== id);
    if (next.length === books.length) return false;
    writeJson("catalog.json", next);
    return true;
  });

  if (!found) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
