// Builds src/lib/data/sl-locations.json from an open Sri Lanka cities/postal-codes dataset.
//
//   node scripts/build-locations.mjs <cities.sql> <districts.sql> [old-towns.json]
//
// Source: https://github.com/madurapa/sri-lanka-provinces-districts-cities (MIT License)
//   cities.sql: 2,154 cities with district and postal code; districts.sql: the 25 districts.
// Output rows: [town, district, postalCode]. The towns of the previous hand-written list that are not
// in the dataset (by normalised name) are kept so no existing checkout choice disappears.
import fs from "node:fs";

const [, , citiesFile, districtsFile, oldFile] = process.argv;

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
    let quoted = false;
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
        quoted = true;
      } else if (ch === ",") {
        fields.push(quoted ? cur.trim() : cur.trim() === "NULL" ? null : cur.trim());
        cur = "";
        quoted = false;
      } else if (ch === ")") {
        fields.push(quoted ? cur.trim() : cur.trim() === "NULL" ? null : cur.trim());
        i++;
        break;
      } else cur += ch;
    }
    yield fields;
  }
}
const body = (file) => {
  const t = fs.readFileSync(file, "utf8");
  return t.slice(t.indexOf("VALUES") + 6);
};

const districts = new Map();
for (const f of tuples(body(districtsFile))) districts.set(f[0], f[2]);

// post offices that serve institutions rather than places a customer lives
const INSTITUTION = /^(central camp|colombo general hospital|colombo kachcheri|colombo labour sec|colombo secretariant|panagoda army camp|parliament of sri lanka|university of colombo|vidyodaya university|katunayake air force camp)$/i;

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const rows = [];
const seen = new Set();
for (const f of tuples(body(citiesFile))) {
  const district = districts.get(f[1]);
  // drop province tags like "(WP)", "(SAB)", "(FTZ)" that some post offices carry
  const town = (f[2] || "").replace(/s*((WP|SAB|SP|CP|NP|NC|NW|EP|UVA|FTZ))s*$/i, "").trim();
  if (!district || !town || INSTITUTION.test(town)) continue;
  const key = norm(town) + "|" + district;
  if (seen.has(key)) continue;
  seen.add(key);
  rows.push([town, district, f[8] || ""]);
}

let kept = 0;
if (oldFile) {
  // [{ name: district, towns: [...] }]: keep any old town that the dataset doesn't have
  const old = JSON.parse(fs.readFileSync(oldFile, "utf8"));
  for (const d of old) {
    for (const t of d.towns) {
      if (!seen.has(norm(t) + "|" + d.name) && !rows.some(([n]) => norm(n) === norm(t))) {
        rows.push([t, d.name, ""]);
        seen.add(norm(t) + "|" + d.name);
        kept++;
      }
    }
  }
}

rows.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
fs.mkdirSync("src/lib/data", { recursive: true });
fs.writeFileSync("src/lib/data/sl-locations.json", JSON.stringify(rows));
console.log({ districts: districts.size, towns: rows.length, keptFromOldList: kept });
