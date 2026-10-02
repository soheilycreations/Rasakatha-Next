// One-off: recovers the old WooCommerce product slugs/IDs and category slugs from
// the SQL backup so we can 308-redirect old Google-indexed URLs.
//
//   node scripts/extract-legacy-urls.mjs "old site/<dump>.sql.gz" supabase/data/legacy-urls.json
//
// The dump is huge, so it is streamed: only the wp_posts / wp_terms /
// wp_term_taxonomy / wp_options INSERT blocks are parsed.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import readline from "node:readline";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/extract-legacy-urls.mjs <dump.sql.gz> <out.json>");
  process.exit(1);
}

// Splits "(a,'b',c),(d,...)" style row tuples. Honors quotes and backslash escapes.
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
          cur += text[i + 1] ?? "";
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

const TABLES = new Set(["wp_posts", "wp_terms", "wp_term_taxonomy", "wp_term_relationships", "wp_options"]);
const products = [];
const terms = new Map();
const taxonomies = [];
const relationships = [];
const pages = [];
const options = {};

const rl = readline.createInterface({ input: fs.createReadStream(input).pipe(zlib.createGunzip()), crlfDelay: Infinity });
let current = null;
let buffer = "";

function flush() {
  if (!current) return;
  for (const f of tuples(buffer)) {
    if (current === "wp_posts") {
      // ID(0) ... post_status(7) ... post_name(11) ... post_parent(17) ... post_type(20)
      if (f[20] === "product") products.push({ id: f[0], slug: f[11], status: f[7], title: f[5] });
      else if (f[20] === "page" && f[7] === "publish") pages.push({ id: f[0], slug: f[11], title: f[5] });
    } else if (current === "wp_terms") {
      terms.set(f[0], { name: f[1], slug: f[2] });
    } else if (current === "wp_term_taxonomy") {
      // term_taxonomy_id, term_id, taxonomy, description, parent, count
      taxonomies.push({ ttId: f[0], termId: f[1], taxonomy: f[2], parent: f[4], count: f[5] });
    } else if (current === "wp_term_relationships") {
      relationships.push([f[0], f[1]]);
    } else if (current === "wp_options") {
      if (["permalink_structure", "woocommerce_permalinks", "woocommerce_shop_page_id"].includes(f[1])) options[f[1]] = f[2];
    }
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

const categories = taxonomies
  .filter((t) => t.taxonomy === "product_cat")
  .map((t) => ({ ...terms.get(t.termId), ttId: t.ttId, parent: t.parent, count: Number(t.count) }))
  .filter((c) => c.slug);

const catTt = new Set(categories.map((c) => c.ttId));
const productCategories = {};
for (const [objectId, ttId] of relationships) {
  if (catTt.has(ttId)) (productCategories[objectId] ||= []).push(ttId);
}

const result = {
  generatedFrom: path.basename(input),
  options,
  pages,
  productCategories,
  products: products.filter((p) => p.slug),
  categories,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 1));
const published = result.products.filter((p) => p.status === "publish").length;
console.log(`products: ${result.products.length} (${published} published), categories: ${categories.length}`);
console.log("options:", options);
