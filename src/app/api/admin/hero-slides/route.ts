import { NextResponse } from "next/server";
import { audit } from "@/lib/server/audit";
import { parseBody } from "@/lib/server/validate";
import { heroSlideSchema } from "@/lib/schemas/admin";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/server/supabase";
import { getHeroSlides, rowToSlide } from "@/lib/server/heroSlides";
import type { HeroSlide } from "@/lib/hero-slides";

export async function GET() {
  return NextResponse.json(await getHeroSlides());
}

export async function POST(request: Request) {
  const parsedBody = await parseBody(request, heroSlideSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data as Partial<HeroSlide>;

  const { data: last } = await supabase()
    .from("hero_slides")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase()
    .from("hero_slides")
    .insert({
      id: body.id?.trim() || Date.now().toString(),
      title: body.title || "Untitled",
      cover: body.cover || "",
      author: body.author || null,
      price: body.price != null ? Number(body.price) : null,
      position: (last?.position ?? -1) + 1,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  await audit({ action: "hero.create", entity: "hero_slide", entityId: data.id, after: data });
  return NextResponse.json(rowToSlide(data));
}

export async function PUT(request: Request) {
  const parsedBody = await parseBody(request, heroSlideSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data as HeroSlide;
  const { data: before } = await supabase().from("hero_slides").select("*").eq("id", body.id).maybeSingle();
  const { data, error } = await supabase()
    .from("hero_slides")
    .update({
      title: body.title,
      cover: body.cover,
      author: body.author || null,
      price: body.price != null ? Number(body.price) : null,
    })
    .eq("id", body.id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  revalidatePath("/");
  await audit({ action: "hero.update", entity: "hero_slide", entityId: body.id, before, after: data });
  return NextResponse.json(rowToSlide(data));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data: before } = await supabase().from("hero_slides").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase().from("hero_slides").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  await audit({ action: "hero.delete", entity: "hero_slide", entityId: id, before }); // layout config, not business data
  return NextResponse.json({ ok: true });
}
