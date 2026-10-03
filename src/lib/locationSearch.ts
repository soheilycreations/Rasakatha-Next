import { LOCATIONS, type Location } from "./shipping";
import { normalizeText, phoneticKey } from "./searchText";

// Fast search over the full list of Sri Lanka Post towns (2,100+): by town, district or postal code,
// tolerant of Singlish spelling and one-or-two-letter typos.

type Entry = { loc: Location; town: string; district: string; text: string; key: string; words: string[] };

const ENTRIES: Entry[] = LOCATIONS.map((loc) => {
  const town = normalizeText(loc.town);
  const district = normalizeText(loc.district);
  const text = `${town} ${district} ${loc.postalCode}`;
  return { loc, town, district, text, key: phoneticKey(text), words: phoneticKey(loc.town).split(" ") };
});

// Levenshtein distance, bailing out once it exceeds `max`.
function within(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

export function searchLocations(query: string, limit = 40): Location[] {
  const q = normalizeText(query);
  if (!q) return [];
  const tokens = q.split(" ");
  const keys = tokens.map((t) => phoneticKey(t));

  const scored: { loc: Location; score: number }[] = [];
  for (const e of ENTRIES) {
    let ok = true;
    let score = 0;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (e.text.includes(t) || e.key.includes(keys[i])) {
        // better when the token starts the town name or equals the postal code
        if (e.town.startsWith(t) || e.words[0]?.startsWith(keys[i])) score += 3;
        else if (e.town.includes(t)) score += 2;
        else score += 1;
        if (t === e.loc.postalCode) score += 4;
      } else {
        ok = false;
        break;
      }
    }
    if (ok) {
      if (e.town === q) score += 6;
      scored.push({ loc: e.loc, score });
    }
  }

  // Few hits and a word of 4+ letters: allow small typos ("nugegodaa", "kolamba").
  if (scored.length < 5 && q.length >= 4 && !/^\d+$/.test(q)) {
    const have = new Set(scored.map((s) => s.loc));
    const max = q.length >= 7 ? 2 : 1;
    const qk = phoneticKey(q);
    for (const e of ENTRIES) {
      if (have.has(e.loc)) continue;
      if (tokens.every((_, i) => e.words.some((w) => within(keys[i], w, max) || (qk.length >= 4 && within(qk, w, max))))) {
        scored.push({ loc: e.loc, score: 0 });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.loc.town.length - b.loc.town.length || a.loc.town.localeCompare(b.loc.town))
    .slice(0, limit)
    .map((s) => s.loc);
}
