import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getCatalog, type CatalogBook } from "@/lib/catalog";
import { displayRating } from "@/lib/format";

export async function GET() {
  const { data: metaRows } = await supabase().from("author_meta").select("*");
  const meta = new Map((metaRows ?? []).map((m) => [m.name as string, m]));

  const byAuthor = new Map<string, CatalogBook[]>();
  for (const b of await getCatalog()) {
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
      bio: (meta.get(name)?.bio as string) || "",
      photo: (meta.get(name)?.photo as string) || "",
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(authors);
}

export async function PUT(request: Request) {
  const { name, bio, photo } = (await request.json()) as { name: string; bio?: string; photo?: string };
  if (!name) return NextResponse.json({ error: "Missing author name" }, { status: 400 });

  const { data: current } = await supabase().from("author_meta").select("*").eq("name", name).maybeSingle();
  const next = { name, bio: bio ?? current?.bio ?? "", photo: photo ?? current?.photo ?? "" };
  const { error } = await supabase().from("author_meta").upsert(next);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...next });
}
