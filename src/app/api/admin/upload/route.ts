import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";

const BUCKET = "covers";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 10MB)" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed" }, { status: 400 });
  }

  const idHint = String(form.get("idHint") || "").replace(/[^a-zA-Z0-9-]/g, "") || Date.now().toString();
  const filename = `book-${idHint}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase()
    .storage.from(BUCKET)
    .upload(filename, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase().storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
