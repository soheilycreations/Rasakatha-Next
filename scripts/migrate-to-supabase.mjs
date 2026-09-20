// One-off migration: uploads public/covers to Supabase Storage and loads the
// JSON data into Postgres. Safe to re-run (uploads/upserts are idempotent).
//
//   node --env-file=.env.local scripts/migrate-to-supabase.mjs
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const root = process.cwd();
const dataDir = path.join(root, "src", "lib", "data");
const coversDir = path.join(root, "public", "covers");
const BUCKET = "covers";
const readJson = (f, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf-8"));
  } catch {
    return fallback;
  }
};

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function ensureBucket() {
  const { error } = await sb.storage.createBucket(BUCKET, { public: true });
  if (error && !/already exists/i.test(error.message)) throw error;
}

async function existingCovers() {
  const names = new Set();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(BUCKET).list("", { limit: 1000, offset });
    if (error) throw error;
    data.forEach((f) => names.add(f.name));
    if (data.length < 1000) break;
  }
  return names;
}

async function uploadWithRetry(file, body) {
  let error;
  for (let attempt = 1; attempt <= 4; attempt++) {
    ({ error } = await sb.storage.from(BUCKET).upload(file, body, {
      upsert: true,
      contentType: MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      cacheControl: "31536000",
    }));
    if (!error) return null;
    await new Promise((r) => setTimeout(r, attempt * 1500));
  }
  return error;
}

async function uploadCovers() {
  const already = await existingCovers();
  const files = fs.readdirSync(coversDir).filter((f) => !already.has(f));
  console.log(`Covers to upload: ${files.length} (${already.size} already in bucket)`);
  let done = 0;
  let failed = 0;
  const queue = [...files];
  const worker = async () => {
    while (queue.length) {
      const file = queue.shift();
      const body = fs.readFileSync(path.join(coversDir, file));
      const error = await uploadWithRetry(file, body);
      if (error) {
        failed++;
        console.error(`  upload failed: ${file}: ${error.message}`);
      }
      if (++done % 100 === 0) console.log(`  covers: ${done}/${files.length}`);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`Covers uploaded this run: ${done - failed}/${files.length}`);
  if (failed) console.warn(`${failed} cover uploads failed; re-run the script to retry them.`);
}

async function upsertChunks(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await sb.from(table).upsert(rows.slice(i, i + 200), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  console.log(`${table}: ${rows.length} rows`);
}

const publicCover = (c) =>
  c && c.startsWith("/covers/") ? `${url}/storage/v1/object/public/${BUCKET}/${c.slice("/covers/".length)}` : c;

async function main() {
  await ensureBucket();
  await uploadCovers();

  const books = readJson("catalog.json", []).map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author ?? "",
    publisher: b.publisher ?? null,
    category: b.category ?? "Other",
    regular_price: b.regularPrice ?? 0,
    sale_price: b.salePrice ?? null,
    on_sale: !!b.onSale,
    in_stock: b.inStock !== false,
    rating: b.rating ?? 0,
    blurb: b.blurb ?? "",
    cover: publicCover(b.cover) ?? null,
    weight: b.weight ?? 303,
  }));
  await upsertChunks("books", books, "id");

  const slides = readJson("hero-slides.json", []).map((s, i) => ({
    id: s.id,
    title: s.title,
    cover: s.cover,
    author: s.author ?? null,
    price: s.price ?? null,
    position: i,
  }));
  await upsertChunks("hero_slides", slides, "id");

  const authors = Object.entries(readJson("authors-meta.json", {})).map(([name, m]) => ({
    name,
    bio: m.bio ?? "",
    photo: m.photo ?? "",
  }));
  if (authors.length) await upsertChunks("author_meta", authors, "name");

  const cats = Object.entries(readJson("categories-meta.json", {})).map(([name, m]) => ({
    name,
    image: m.image ?? "",
    order_index: m.order ?? 999,
  }));
  if (cats.length) await upsertChunks("category_meta", cats, "name");

  console.log("Migration complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
