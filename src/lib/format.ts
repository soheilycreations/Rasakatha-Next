export function money(n: number): string {
  return "Rs. " + Math.round(n).toLocaleString("en-US");
}

export function discountPercent(regularPrice: number, salePrice: number): number {
  if (regularPrice <= 0) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

const TINTS = [
  "#7c1c18", "#1f4d63", "#5a3b1e", "#2f5a3a", "#3d2a52",
  "#6b2320", "#4a3a1c", "#155158", "#5f2136", "#3f4a1e",
];

export function tintForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export function displayRating(id: string, rating: number): number {
  if (rating > 0) return rating;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return 3.6 + (hash % 15) / 10;
}
