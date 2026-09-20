import { NextResponse } from "next/server";
import { readJson, withFileLock, writeJson } from "@/lib/server/jsonStore";
import { getCategories } from "@/lib/catalog";

type CategoryMeta = { image?: string; order?: number };

export async function GET() {
  const meta = readJson<Record<string, CategoryMeta>>("categories-meta.json", {});
  const categories = getCategories()
    .map((c) => ({
      ...c,
      image: meta[c.name]?.image || "",
      order: meta[c.name]?.order ?? 999,
    }))
    .sort((a, b) => a.order - b.order || b.count - a.count);
  return NextResponse.json(categories);
}

export async function PUT(request: Request) {
  const { name, image, order } = (await request.json()) as { name: string; image?: string; order?: number };
  if (!name) return NextResponse.json({ error: "Missing category name" }, { status: 400 });

  const saved = await withFileLock("categories-meta.json", () => {
    const meta = readJson<Record<string, CategoryMeta>>("categories-meta.json", {});
    meta[name] = {
      image: image ?? meta[name]?.image ?? "",
      order: order ?? meta[name]?.order ?? 999,
    };
    writeJson("categories-meta.json", meta);
    return meta[name];
  });

  return NextResponse.json({ ok: true, name, ...saved });
}
