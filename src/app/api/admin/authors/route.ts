import { NextResponse } from "next/server";
import { readJson, withFileLock, writeJson } from "@/lib/server/jsonStore";
import { CATALOG } from "@/lib/catalog";
import { displayRating } from "@/lib/format";

type AuthorMeta = { bio?: string; photo?: string };

export async function GET() {
  const meta = readJson<Record<string, AuthorMeta>>("authors-meta.json", {});
  const byAuthor = new Map<string, typeof CATALOG>();
  for (const b of CATALOG) {
    if (!b.author) continue;
    const list = byAuthor.get(b.author) || [];
    list.push(b);
    byAuthor.set(b.author, list);
  }

  const authors = [...byAuthor.entries()]
    .map(([name, books]) => ({
      name,
      count: books.length,
      avgRating: books.reduce((s, b) => s + displayRating(b.id, b.rating), 0) / books.length,
      covers: books.map((b) => b.cover).filter((c): c is string => !!c).slice(0, 3),
      bio: meta[name]?.bio || "",
      photo: meta[name]?.photo || "",
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(authors);
}

export async function PUT(request: Request) {
  const { name, bio, photo } = (await request.json()) as { name: string; bio?: string; photo?: string };
  if (!name) return NextResponse.json({ error: "Missing author name" }, { status: 400 });

  const saved = await withFileLock("authors-meta.json", () => {
    const meta = readJson<Record<string, AuthorMeta>>("authors-meta.json", {});
    meta[name] = { bio: bio ?? meta[name]?.bio ?? "", photo: photo ?? meta[name]?.photo ?? "" };
    writeJson("authors-meta.json", meta);
    return meta[name];
  });

  return NextResponse.json({ ok: true, name, ...saved });
}
