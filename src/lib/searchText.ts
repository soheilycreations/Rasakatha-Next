// Search text normalisation shared by the catalog search and suggestions.
// Titles look like "සිංහල | English", so everything (both halves) is folded into
// one searchable string. Latin text is further reduced to a rough phonetic key
// so Singlish spelling variants meet: "dheka" ~ "deka", "wijebandara" ~ "vijebandara".

// Keep letters/digits in any script plus Sinhala combining marks, drop punctuation.
export function normalizeText(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

const LATIN_RULES: [RegExp, string][] = [
  [/([a-z])\1+/g, "$1"], // double letters: "ll" -> "l", "aa" -> "a"
  [/ph/g, "p"],
  [/th/g, "t"],
  [/dh/g, "d"],
  [/kh/g, "k"],
  [/gh/g, "g"],
  [/bh/g, "b"],
  [/sh/g, "s"],
  [/w/g, "v"],
  [/z/g, "s"],
  [/c(?=[ei])/g, "s"],
  [/c/g, "k"],
  [/q/g, "k"],
  [/x/g, "ks"],
];

export function phoneticKey(input: string): string {
  let s = normalizeText(input);
  for (const [re, to] of LATIN_RULES) s = s.replace(re, to);
  return s;
}

export function tokens(input: string): string[] {
  return normalizeText(input).split(" ").filter(Boolean);
}
