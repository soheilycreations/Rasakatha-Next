// Builds the book-data import from the old WooCommerce export (supabase/data/legacy-details.json,
// produced by extract-legacy-details.mjs) compared with the live catalog (read-only).
//
//   node --env-file=.env.local scripts/build-book-data.mjs
//
// Writes (nothing is applied to the database):
//   supabase/data/book-data.json     per book: new blurb, published_at, publisher, is_own_title, pages, binding, isbn, language
//   supabase/data/book-data.sql      UPDATE statements, run AFTER supabase/book-order.sql and supabase/book-details.sql
//   supabase/data/book-data-report.json   counts, before/after samples, publisher fixes, unknown publishers
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const woo = JSON.parse(fs.readFileSync("supabase/data/legacy-details.json", "utf8"));
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const books = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("books").select("id,title,blurb,publisher,category").order("id").range(from, from + 999);
  if (error) throw error;
  books.push(...data);
  if (data.length < 1000) break;
}

// ---------- text cleaning ----------
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
function decode(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
function clean(raw) {
  if (!raw) return "";
  let s = String(raw);
  s = s.replace(/\[\/?[a-z_][^\]]*\]/gi, " "); // shortcodes
  s = s.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n\n").replace(/<li[^>]*>/gi, "• ");
  s = s.replace(/<[^>]+>/g, "");
  s = decode(s);
  s = s.replace(/\r\n?/g, "\n").replace(/[ \t\f\v ]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

// lines that only describe the physical book ("A5 size", "192 Pages", "Hard Cover" ...)
const SPEC_LINE = /^(a\s?[3-7]\s*size|b\s?[4-6]\s*size|\d{1,4}\s*pages?(\s+per\s+pack)?|.*\b(hard\s*cover|paper\s*back|normal\s*cover|jacket\s*cover)\b.*|\d+\s*gsm.*|isbn.*|\d+\s*cm\s*[*x×]\s*\d+\s*cm|detachable|inside .*print.*|.*bullet design.*|.*\bpages? per pack\b.*)$/i;
function stripSpecLines(text) {
  const kept = text.split("\n").filter((l) => !SPEC_LINE.test(l.trim()));
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function specsFrom(text) {
  const out = {};
  const pages = /(\d{2,4})\s*pages?\b(?!\s*per\s*pack)/i.exec(text);
  if (pages && !/per\s*pack/i.test(text)) out.pages = Number(pages[1]);
  if (/hard\s*cover|hardcover/i.test(text)) out.binding = "Hardcover";
  else if (/paper\s*back|normal\s*cover/i.test(text)) out.binding = "Paperback";
  const isbn = /ISBN[^0-9Xx]{0,12}([0-9][0-9\- ]{8,15}[0-9Xx])/i.exec(text);
  if (isbn) out.isbn = isbn[1].replace(/\s+/g, "");
  const size = /\b([AB]\s?[3-7])\s*size\b/i.exec(text);
  if (size) out.size = size[1].replace(/\s/g, "").toUpperCase();
  return out;
}

const OWN = /rasa\s*katha/i;
const OWN_NAME = "Rasakatha Publishers";
const normPublisher = (p) => (p && OWN.test(p) ? OWN_NAME : p);
const BINDING = { "Hard Cover": "Hardcover", "Normal Cover": "Paperback", "Jacket Cover": "Hardcover" };
const LANG = { sinhala: "si", english: "en", tamil: "ta" };

// ---------- build ----------
const result = {};
const report = {
  descriptions: { filled: 0, improved: 0, unchanged: 0, keptLongerCurrent: 0, stillEmpty: 0 },
  publishers: { normalizedFromVariant: 0, filledFromWoo: 0, stillUnknown: [] },
  specs: { pages: 0, binding: 0, isbn: 0, language: 0, sizeFoundButNoColumn: 0 },
  samples: [],
  publisherVariantsSeen: {},
};

for (const b of books) {
  const w = woo[b.id];
  const entry = {};
  const cur = (b.blurb || "").trim();

  if (w) {
    const rawBest = clean(w.content) || clean(w.excerpt);
    const real = stripSpecLines(rawBest);
    const candidate = real.length >= 15 ? real : rawBest; // only drop spec lines if a real description exists
    if (!candidate) {
      if (!cur) report.descriptions.stillEmpty++;
      else report.descriptions.unchanged++;
    } else if (!cur) {
      entry.blurb = candidate;
      report.descriptions.filled++;
    } else if (candidate.length > cur.length + 5) {
      entry.blurb = candidate;
      report.descriptions.improved++;
      if (report.samples.length < 5 && cur.length > 150) report.samples.push({ id: b.id, title: b.title, before: cur, after: candidate.slice(0, 600) + (candidate.length > 600 ? "…" : ""), beforeLen: cur.length, afterLen: candidate.length });
    } else if (candidate.length + 5 < cur.length) {
      report.descriptions.keptLongerCurrent++;
    } else report.descriptions.unchanged++;

    // specs: WooCommerce meta/attributes win over text guesses
    const sp = specsFrom(clean(w.content) + "\n" + clean(w.excerpt));
    const pc = Number(String(w.meta.page_count ?? "").replace(/\D/g, ""));
    if (pc > 0) entry.pages = pc;
    else if (sp.pages) entry.pages = sp.pages;
    const cover = (w.attrs.pa_cover || [])[0];
    if (cover && BINDING[cover]) entry.binding = BINDING[cover];
    else if (sp.binding) entry.binding = sp.binding;
    if (sp.isbn) entry.isbn = sp.isbn;
    const lang = LANG[String(w.meta.language ?? "").trim().toLowerCase()];
    if (lang) entry.language = lang;
    if (sp.size) report.specs.sizeFoundButNoColumn++;
    if (entry.pages) report.specs.pages++;
    if (entry.binding) report.specs.binding++;
    if (entry.isbn) report.specs.isbn++;
    if (entry.language) report.specs.language++;

    // real publish date (post_date is site-local time, Sri Lanka = +05:30)
    if (w.date) entry.publishedAt = w.date.replace(" ", "T") + "+05:30";
  }

  // publisher
  const wooPublisher = (w?.attrs?.["publisher-category"] || [])[0];
  let publisher = b.publisher || null;
  if (publisher) report.publisherVariantsSeen[publisher] = (report.publisherVariantsSeen[publisher] || 0) + 1;
  if (!publisher && wooPublisher) {
    publisher = wooPublisher;
    report.publishers.filledFromWoo++;
  }
  const normalized = normPublisher(publisher);
  if (publisher && normalized !== publisher) report.publishers.normalizedFromVariant++;
  if (normalized && normalized !== b.publisher) entry.publisher = normalized;
  if (!normalized) report.publishers.stillUnknown.push({ id: b.id, title: b.title, category: b.category });
  entry.isOwnTitle = !!(normalized && OWN.test(normalized));

  result[b.id] = entry;
}

fs.writeFileSync("supabase/data/book-data.json", JSON.stringify(result));

// ---------- SQL ----------
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [
  "-- Generated by scripts/build-book-data.mjs from the old WooCommerce export. NOT applied automatically.",
  "-- Run supabase/book-order.sql and supabase/book-details.sql first.",
  "-- Blurbs overwrite only when the old text is longer than the current one; detail columns fill only empty values.",
  "begin;",
];
for (const [id, e] of Object.entries(result)) {
  const sets = [];
  if (e.blurb !== undefined) sets.push(`blurb = ${q(e.blurb)}`);
  if (e.publishedAt) sets.push(`published_at = ${q(e.publishedAt)}`);
  if (e.publisher) sets.push(`publisher = ${q(e.publisher)}`);
  sets.push(`is_own_title = ${e.isOwnTitle}`);
  if (e.pages) sets.push(`pages = coalesce(pages, ${e.pages})`);
  if (e.binding) sets.push(`binding = coalesce(binding, ${q(e.binding)})`);
  if (e.isbn) sets.push(`isbn = coalesce(isbn, ${q(e.isbn)})`);
  if (e.language) sets.push(`language = coalesce(language, ${q(e.language)})`);
  lines.push(`update books set ${sets.join(", ")} where id = ${q(id)};`);
}
lines.push("commit;");
fs.writeFileSync("supabase/data/book-data.sql", lines.join("\n") + "\n");

report.counts = {
  books: books.length,
  ownTitles: Object.values(result).filter((e) => e.isOwnTitle).length,
  withPublishedAt: Object.values(result).filter((e) => e.publishedAt).length,
};
fs.writeFileSync("supabase/data/book-data-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, publishers: { ...report.publishers, stillUnknown: report.publishers.stillUnknown.length }, samples: undefined, publisherVariantsSeen: Object.fromEntries(Object.entries(report.publisherVariantsSeen).filter(([k]) => OWN.test(k))) }, null, 1));
