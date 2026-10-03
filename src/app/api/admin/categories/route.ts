import { NextResponse } from "next/server";
import { audit } from "@/lib/server/audit";
import { parseBody } from "@/lib/server/validate";
import { categoryPutSchema } from "@/lib/schemas/admin";
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
  const parsedBody = await parseBody(request, categoryPutSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const { name, image, order } = parsedBody.data;

  const { data: current } = await supabase().from("category_meta").select("*").eq("name", name).maybeSingle();
  const next = {
    name,
    image: image ?? current?.image ?? "",
    order_index: order ?? current?.order_index ?? 999,
  };
  const { error } = await supabase().from("category_meta").upsert(next);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit({ action: "categories.update", entity: "category", entityId: name, before: current, after: next });
  return NextResponse.json({ ok: true, name, image: next.image, order: next.order_index });
}
