import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabase } from "@/lib/server/supabase";

const BUCKET = "covers";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 900;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Uploads are converted to a max-900px WebP (quality 80) so covers stay small on the storefront.
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 10MB)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed" }, { status: 400 });
  }

  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "That file couldn't be read as an image" }, { status: 400 });
  }

  const idHint = String(form.get("idHint") || "").replace(/[^a-zA-Z0-9-]/g, "") || Date.now().toString();
  const filename = `book-${idHint}-${Math.random().toString(36).slice(2, 8)}.webp`;

  const { error } = await supabase().storage.from(BUCKET).upload(filename, webp, { contentType: "image/webp", upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase().storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
