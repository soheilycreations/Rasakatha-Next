// One-off: shrinks every book cover stored in Supabase Storage.
//
// Downloads each cover, makes a max-900px WebP (quality 80), uploads it next to the
// original (same folder, "<name>-opt.webp") and points books.cover at the new file.
// Originals are NOT deleted, so this can be undone by restoring the old URLs.
//
//   node --env-file=.env.local scripts/optimize-covers.ts                # dry run (reads only)
//   node --env-file=.env.local scripts/optimize-covers.ts --limit 20     # dry run on 20 covers
//   node --env-file=.env.local scripts/optimize-covers.ts --apply        # uploads + updates the database
//
// Safe to re-run: covers that are already .webp are skipped.
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const flag = (name: string, fallback: number) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) || fallback : fallback;
};
const LIMIT = flag("--limit", Infinity);
const CONCURRENCY = flag("--concurrency", 4);
const MAX_SIDE = 900;
const QUALITY = 80;
const BUCKET = "covers";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local)");
const sb = createClient(url, key, { auth: { persistSession: false } });

const PUBLIC_PREFIX = `${url.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/`;

type Row = { id: string; cover: string };

async function loadCovers(): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("books").select("id, cover").not("cover", "is", null).order("id").range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as Row[]));
    if (data.length < 1000) break;
  }
  return rows.filter((r) => r.cover.startsWith(PUBLIC_PREFIX) && !r.cover.toLowerCase().endsWith(".webp"));
}

let before = 0;
let after = 0;
let done = 0;
let failed = 0;

async function processOne(row: Row, total: number) {
  const path = decodeURIComponent(row.cover.slice(PUBLIC_PREFIX.length).split("?")[0]);
  try {
    const res = await fetch(row.cover);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    const webp = await sharp(original, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toBuffer();
    before += original.length;
    after += webp.length;

    if (APPLY) {
      const newPath = path.replace(/\.[^./]+$/, "") + "-opt.webp";
      const { error: upErr } = await sb.storage.from(BUCKET).upload(newPath, webp, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      const newUrl = sb.storage.from(BUCKET).getPublicUrl(newPath).data.publicUrl;
      const { error: dbErr } = await sb.from("books").update({ cover: newUrl }).eq("id", row.id);
      if (dbErr) throw dbErr;
    }
    done++;
    console.log(`[${done + failed}/${total}] ${row.id}  ${(original.length / 1024).toFixed(0)} KB -> ${(webp.length / 1024).toFixed(0)} KB`);
  } catch (err) {
    failed++;
    console.error(`[${done + failed}/${total}] ${row.id} FAILED: ${err instanceof Error ? err.message : err}`);
  }
}

async function main() {
  const covers = (await loadCovers()).slice(0, LIMIT);
  console.log(`${covers.length} covers to optimise (${APPLY ? "APPLY: uploads + database updates" : "dry run: nothing is written"})`);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENT(covers.length) }, async () => {
      while (next < covers.length) await processOne(covers[next++], covers.length);
    })
  );
  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  console.log(`\nDone: ${done} ok, ${failed} failed. ${mb(before)} MB -> ${mb(after)} MB (${before ? Math.round((1 - after / before) * 100) : 0}% smaller)`);
  if (!APPLY) console.log("Dry run only. Re-run with --apply to upload and update books.cover.");
}

function CONCURRENT(n: number) {
  return Math.max(1, Math.min(CONCURRENCY, n));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
