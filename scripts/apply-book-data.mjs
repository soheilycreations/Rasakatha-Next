// Applies supabase/data/book-data.json (descriptions, publish dates, publisher fixes, own-title flags,
// pages/binding/language) to the live `books` table through the API. Same effect as book-data.sql.
//
//   node --env-file=.env.local scripts/apply-book-data.mjs            # check only (prints what would change)
//   node --env-file=.env.local scripts/apply-book-data.mjs --apply    # write
//
// Needs supabase/book-order.sql and supabase/book-details.sql to have been run first.
// Take a backup first (supabase/backups/books-*.json). Detail columns are only filled when empty;
// blurbs are only replaced when the imported text is longer (already decided when the file was built).
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const data = JSON.parse(fs.readFileSync("supabase/data/book-data.json", "utf8"));

const probe = await sb.from("books").select("published_at,is_own_title,pages,binding,language").limit(1);
if (probe.error) {
  console.error("books.published_at / is_own_title (or detail columns) are missing: run supabase/book-order.sql and book-details.sql first.\n", probe.error.message);
  process.exit(1);
}

const current = new Map();
for (let from = 0; ; from += 1000) {
  const { data: rows, error } = await sb.from("books").select("id,blurb,publisher,pages,binding,isbn,language,published_at,is_own_title").order("id").range(from, from + 999);
  if (error) throw error;
  for (const r of rows) current.set(r.id, r);
  if (rows.length < 1000) break;
}

const stats = { books: 0, blurb: 0, publishedAt: 0, publisher: 0, ownTitle: 0, pages: 0, binding: 0, isbn: 0, language: 0, failed: 0 };
const jobs = [];
for (const [id, e] of Object.entries(data)) {
  const cur = current.get(id);
  if (!cur) continue;
  const patch = {};
  if (e.blurb !== undefined) patch.blurb = e.blurb;
  if (e.publishedAt) patch.published_at = e.publishedAt;
  if (e.publisher) patch.publisher = e.publisher;
  patch.is_own_title = !!e.isOwnTitle;
  if (e.pages && cur.pages == null) patch.pages = e.pages;
  if (e.binding && !cur.binding) patch.binding = e.binding;
  if (e.isbn && !cur.isbn) patch.isbn = e.isbn;
  if (e.language && !cur.language) patch.language = e.language;
  jobs.push([id, patch]);
}

let next = 0;
async function worker() {
  while (next < jobs.length) {
    const [id, patch] = jobs[next++];
    if (APPLY) {
      const { error } = await sb.from("books").update(patch).eq("id", id);
      if (error) {
        stats.failed++;
        console.error(id, error.message);
        continue;
      }
    }
    stats.books++;
    if ("blurb" in patch) stats.blurb++;
    if ("published_at" in patch) stats.publishedAt++;
    if ("publisher" in patch) stats.publisher++;
    if (patch.is_own_title) stats.ownTitle++;
    for (const k of ["pages", "binding", "isbn", "language"]) if (k in patch) stats[k]++;
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(APPLY ? "applied:" : "would apply (dry run):", stats);

if (APPLY) {
  const count = async (build) => (await build(sb.from("books").select("id", { count: "exact", head: true }))).count;
  console.log("after:", {
    total: await count((q) => q),
    published_at_set: await count((q) => q.not("published_at", "is", null)),
    own_titles: await count((q) => q.eq("is_own_title", true)),
    empty_blurb: await count((q) => q.or("blurb.is.null,blurb.eq.")),
    no_publisher: await count((q) => q.or("publisher.is.null,publisher.eq.")),
    with_pages: await count((q) => q.not("pages", "is", null)),
    with_binding: await count((q) => q.not("binding", "is", null)),
    with_language: await count((q) => q.not("language", "is", null)),
  });
}
