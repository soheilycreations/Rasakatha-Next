import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { getHeroSlides, rowToSlide } from "@/lib/server/heroSlides";
import type { HeroSlide } from "@/lib/hero-slides";

export async function GET() {
  return NextResponse.json(await getHeroSlides());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<HeroSlide>;

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
  return NextResponse.json(rowToSlide(data));
}

export async function PUT(request: Request) {
  const body = (await request.json()) as HeroSlide;
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
  return NextResponse.json(rowToSlide(data));
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabase().from("hero_slides").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
