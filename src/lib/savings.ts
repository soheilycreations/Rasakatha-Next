import type { CartItem } from "./cart";

// Savings = (regular price - price paid) x qty over discounted lines. Lines without a regular price
// (carts saved before this existed) simply count as no saving. The server uses the same function on
// the catalog-built order, so what the customer sees is what the order stores.
type Line = Pick<CartItem, "price" | "regularPrice" | "qty">;

export function lineSavings(i: Line): number {
  return i.regularPrice != null && i.price != null && i.regularPrice > i.price ? (i.regularPrice - i.price) * i.qty : 0;
}

export function totalSavings(items: Line[]): number {
  return items.reduce((s, i) => s + lineSavings(i), 0);
}

// What the books would cost at regular prices.
export function regularSubtotal(items: Line[]): number {
  return items.reduce((s, i) => s + (i.regularPrice != null && i.price != null && i.regularPrice > i.price ? i.regularPrice : i.price ?? 0) * i.qty, 0);
}
