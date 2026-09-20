import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getCategories } from "@/lib/catalog";

export async function GET() {
  const { data: metaRows } = await supabase().from("category_meta").select("*");
  const meta = new Map((metaRows ?? []).map((m) => [m.name as string, m]));

  const categories = (await getCategories())
    .map((c) => ({
      ...c,
      image: (meta.get(c.name)?.image as string) || "",
      order: (meta.get(c.name)?.order_index as number) ?? 999,
    }))
    .sort((a, b) => a.order - b.order || b.count - a.count);
  return NextResponse.json(categories);
}

export async function PUT(request: Request) {
  const { name, image, order } = (await request.json()) as { name: string; image?: string; order?: number };
  if (!name) return NextResponse.json({ error: "Missing category name" }, { status: 400 });

  const { data: current } = await supabase().from("category_meta").select("*").eq("name", name).maybeSingle();
  const next = {
    name,
    image: image ?? current?.image ?? "",
    order_index: order ?? current?.order_index ?? 999,
  };
  const { error } = await supabase().from("category_meta").upsert(next);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, name, image: next.image, order: next.order_index });
}
