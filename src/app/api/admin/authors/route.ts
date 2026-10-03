import { NextResponse } from "next/server";
import { audit } from "@/lib/server/audit";
import { parseBody } from "@/lib/server/validate";
import { authorPutSchema } from "@/lib/schemas/admin";
import { supabase } from "@/lib/server/supabase";
import { getCatalog, type CatalogBook } from "@/lib/catalog";

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
      // real ratings only: books nobody has reviewed count as 0
      avgRating: books.reduce((s, b) => s + (b.rating || 0), 0) / books.length,
      covers: books.map((b) => b.cover).filter((c): c is string => !!c).slice(0, 3),
      bio: (meta.get(name)?.bio as string) || "",
      photo: (meta.get(name)?.photo as string) || "",
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(authors);
}

export async function PUT(request: Request) {
  const parsedBody = await parseBody(request, authorPutSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const { name, bio, photo } = parsedBody.data;

  const { data: current } = await supabase().from("author_meta").select("*").eq("name", name).maybeSingle();
  const next = { name, bio: bio ?? current?.bio ?? "", photo: photo ?? current?.photo ?? "" };
  const { error } = await supabase().from("author_meta").upsert(next);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit({ action: "authors.update", entity: "author", entityId: name, before: current, after: next });
  return NextResponse.json({ ok: true, ...next });
}
