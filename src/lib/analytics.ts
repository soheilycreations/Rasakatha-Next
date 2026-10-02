// Thin wrappers over GA4 (gtag) and Meta Pixel (fbq). Both no-op when the
// corresponding script isn't loaded (i.e. its env ID isn't set).

type Item = { id: string; title: string; price: number; qty?: number; category?: string };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const CURRENCY = "LKR";

function gaItems(items: Item[]) {
  return items.map((i) => ({
    item_id: i.id,
    item_name: i.title,
    price: i.price,
    quantity: i.qty ?? 1,
    ...(i.category ? { item_category: i.category } : {}),
  }));
}

function send(ga: [string, Record<string, unknown>], fb: [string, Record<string, unknown>, string?]) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", ga[0], ga[1]);
    if (fb[2]) window.fbq?.("trackCustom", fb[0], fb[1], { eventID: fb[2] });
    else window.fbq?.("track", fb[0], fb[1]);
  } catch {
    // analytics must never break the store
  }
}

const value = (items: Item[]) => items.reduce((s, i) => s + i.price * (i.qty ?? 1), 0);

export function trackViewItem(item: Item) {
  send(
    ["view_item", { currency: CURRENCY, value: item.price, items: gaItems([item]) }],
    ["ViewContent", { content_ids: [item.id], content_name: item.title, content_type: "product", value: item.price, currency: CURRENCY }]
  );
}

export function trackAddToCart(item: Item) {
  send(
    ["add_to_cart", { currency: CURRENCY, value: item.price * (item.qty ?? 1), items: gaItems([item]) }],
    ["AddToCart", { content_ids: [item.id], content_name: item.title, content_type: "product", value: item.price * (item.qty ?? 1), currency: CURRENCY }]
  );
}

export function trackBeginCheckout(items: Item[]) {
  send(
    ["begin_checkout", { currency: CURRENCY, value: value(items), items: gaItems(items) }],
    ["InitiateCheckout", { content_ids: items.map((i) => i.id), num_items: items.length, value: value(items), currency: CURRENCY }]
  );
}

export function trackPurchase(orderId: string, total: number, shipping: number, items: Item[]) {
  // Guard against double-firing on refresh of the thank-you page.
  try {
    const key = `rasakatha:tracked:${orderId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // storage unavailable — fire anyway
  }
  send(
    ["purchase", { transaction_id: orderId, currency: CURRENCY, value: total, shipping, items: gaItems(items) }],
    ["Purchase", { content_ids: items.map((i) => i.id), content_type: "product", num_items: items.length, value: total, currency: CURRENCY }]
  );
}
