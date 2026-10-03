// Extracts descriptions, dates, meta and attribute terms for WooCommerce products from the SQL dump.
//   node scripts/extract-legacy-details.mjs "old site/<dump>.sql.gz" supabase/data/legacy-details.json
// Streams the dump (gunzip + readline); only wp_posts / wp_postmeta / wp_terms / wp_term_taxonomy /
// wp_term_relationships INSERT blocks are parsed.
import fs from "node:fs";
import zlib from "node:zlib";
import readline from "node:readline";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/extract-legacy-details.mjs <dump.sql.gz> <out.json>");
  process.exit(1);
}

function* tuples(text) {
  let i = 0;
  const n = text.length;
  while (i < n) {
    while (i < n && text[i] !== "(") i++;
    if (i >= n) return;
    i++;
    const fields = [];
    let cur = "";
    let inStr = false;
    let wasQuoted = false;
    for (; i < n; i++) {
      const ch = text[i];
      if (inStr) {
        if (ch === "\\") {
          const nx = text[i + 1] ?? "";
          cur += nx === "n" ? "\n" : nx === "r" ? "\r" : nx === "t" ? "\t" : nx === "0" ? "\0" : nx;
          i++;
        } else if (ch === "'") {
          if (text[i + 1] === "'") {
            cur += "'";
            i++;
          } else inStr = false;
        } else cur += ch;
      } else if (ch === "'") {
        inStr = true;
        wasQuoted = true;
      } else if (ch === ",") {
        fields.push(wasQuoted ? cur : cur.trim() === "NULL" ? null : cur.trim());
        cur = "";
        wasQuoted = false;
      } else if (ch === ")") {
        fields.push(wasQuoted ? cur : cur.trim() === "NULL" ? null : cur.trim());
        i++;
        break;
      } else cur += ch;
    }
    yield fields;
  }
}

const TABLES = new Set(["wp_posts", "wp_postmeta", "wp_terms", "wp_term_taxonomy", "wp_term_relationships"]);
const products = new Map(); // id -> {date, content, title, excerpt, status, slug}
const meta = new Map(); // id -> {key: value}
const terms = new Map();
const taxonomies = new Map(); // ttId -> {termId, taxonomy}
const rels = []; // [objectId, ttId]

const KEEP_META = (k) => !k.startsWith("_") || ["_sku", "_regular_price", "_sale_price", "_weight", "_product_attributes", "_wp_old_slug"].includes(k) || /isbn|publisher|author|pages|binding|size/i.test(k);

const rl = readline.createInterface({ input: fs.createReadStream(input).pipe(zlib.createGunzip()), crlfDelay: Infinity });
let current = null;
let buffer = "";
function flush() {
  if (!current) return;
  for (const f of tuples(buffer)) {
    if (current === "wp_posts") {
      if (f[20] === "product") products.set(f[0], { date: f[2], content: f[4], title: f[5], excerpt: f[6], status: f[7], slug: f[11] });
    } else if (current === "wp_postmeta") {
      if (f[2] && KEEP_META(f[2])) {
        const m = meta.get(f[1]) ?? {};
        m[f[2]] = f[3];
        meta.set(f[1], m);
      }
    } else if (current === "wp_terms") terms.set(f[0], { name: f[1], slug: f[2] });
    else if (current === "wp_term_taxonomy") taxonomies.set(f[0], { termId: f[1], taxonomy: f[2] });
    else if (current === "wp_term_relationships") rels.push([f[0], f[1]]);
  }
  current = null;
  buffer = "";
}
for await (const line of rl) {
  const m = /^INSERT INTO `(wp_[a-z_]+)` VALUES/.exec(line);
  if (m) {
    flush();
    if (TABLES.has(m[1])) {
      current = m[1];
      buffer = line.slice(line.indexOf("VALUES") + 6);
    }
    continue;
  }
  if (current) {
    buffer += "\n" + line;
    if (line.endsWith(";")) flush();
  }
}
flush();

// attribute-like taxonomies (pa_*, product_tag, anything except product_cat/type/visibility)
const SKIP_TAX = new Set(["product_cat", "product_type", "product_visibility", "product_shipping_class", "category", "post_tag", "nav_menu", "link_category", "post_format"]);
const attrs = new Map(); // productId -> {taxonomy: [term names]}
for (const [obj, tt] of rels) {
  const tax = taxonomies.get(tt);
  if (!tax || SKIP_TAX.has(tax.taxonomy) || !products.has(obj)) continue;
  const a = attrs.get(obj) ?? {};
  (a[tax.taxonomy] ||= []).push(terms.get(tax.termId)?.name);
  attrs.set(obj, a);
}

const out = {};
for (const [id, p] of products) out[id] = { ...p, meta: meta.get(id) ?? {}, attrs: attrs.get(id) ?? {} };
fs.mkdirSync("supabase/data", { recursive: true });
fs.writeFileSync(output, JSON.stringify(out));
const metaKeys = {};
for (const v of Object.values(out)) for (const k of Object.keys(v.meta)) metaKeys[k] = (metaKeys[k] ?? 0) + 1;
const attrKeys = {};
for (const v of Object.values(out)) for (const k of Object.keys(v.attrs)) attrKeys[k] = (attrKeys[k] ?? 0) + 1;
console.log("products:", products.size, "| meta keys:", metaKeys, "| attribute taxonomies:", attrKeys);
