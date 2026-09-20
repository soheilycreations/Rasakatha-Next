import { NextResponse } from "next/server";
import { readJson, withFileLock, writeJson } from "@/lib/server/jsonStore";
import type { HeroSlide } from "@/lib/hero-slides";

export async function GET() {
  const slides = readJson<HeroSlide[]>("hero-slides.json", []);
  return NextResponse.json(slides);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<HeroSlide>;

  const slide = await withFileLock("hero-slides.json", () => {
    const slides = readJson<HeroSlide[]>("hero-slides.json", []);
    const newSlide: HeroSlide = {
      id: body.id?.trim() || Date.now().toString(),
      title: body.title || "Untitled",
      cover: body.cover || "",
      author: body.author || undefined,
      price: body.price != null ? Number(body.price) : undefined,
    };
    slides.push(newSlide);
    writeJson("hero-slides.json", slides);
    return newSlide;
  });

  return NextResponse.json(slide);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as HeroSlide;

  const result = await withFileLock("hero-slides.json", () => {
    const slides = readJson<HeroSlide[]>("hero-slides.json", []);
    const idx = slides.findIndex((s) => s.id === body.id);
    if (idx === -1) return null;
    slides[idx] = { ...slides[idx], ...body };
    writeJson("hero-slides.json", slides);
    return slides[idx];
  });

  if (!result) return NextResponse.json({ error: "Slide not found" }, { status: 404 });
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await withFileLock("hero-slides.json", () => {
    const slides = readJson<HeroSlide[]>("hero-slides.json", []);
    writeJson(
      "hero-slides.json",
      slides.filter((s) => s.id !== id)
    );
  });

  return NextResponse.json({ ok: true });
}
