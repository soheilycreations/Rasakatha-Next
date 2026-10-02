import { test, expect } from "@playwright/test";

// These tests only read data. None of them creates an order.

async function firstInStockBook(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/api/books?instock=1&limit=1");
  const data = await res.json();
  return data.items[0] as { id: string; title: string };
}

test("home renders books", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/book/"]').first()).toBeVisible();
  expect(await page.locator('a[href^="/book/"]').count()).toBeGreaterThan(5);
});

test("book page has title, price and JSON-LD", async ({ page, request }) => {
  const book = await firstInStockBook(request);
  await page.goto(`/book/${book.id}`);
  await expect(page.locator("h1").first()).not.toBeEmpty();
  await expect(page.getByText(/Rs\.?\s?[\d,]+/).first()).toBeVisible();
  const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
  const graph = raw.map((t) => JSON.parse(t)).flatMap((j) => j["@graph"] ?? [j]);
  const product = graph.find((n) => [n["@type"]].flat().includes("Product"));
  expect(product?.name).toBeTruthy();
  expect(Number(product?.offers?.price)).toBeGreaterThan(0);
});

test("add to cart then checkout shows validation errors", async ({ page, request }) => {
  const book = await firstInStockBook(request);
  await page.goto(`/book/${book.id}`);
  await page.getByRole("button", { name: "Add to Cart" }).first().click();
  await page.goto("/checkout");
  await page.getByRole("button", { name: /Place Order/ }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Enter your email address")).toBeVisible();
});

test("tampered order price is ignored and bad requests are rejected", async ({ request }) => {
  const book = await firstInStockBook(request);
  // Invalid customer, so the server must refuse before anything is saved.
  const bad = await request.post("/api/orders", {
    data: { items: [{ id: book.id, qty: 1, price: 1 }], payment: "cod", total: 1, customer: {} },
  });
  expect(bad.status()).toBe(400);
  // Gateways that aren't enabled can't be selected.
  const koko = await request.post("/api/orders", {
    data: { items: [{ id: book.id, qty: 1 }], payment: "koko", customer: {} },
  });
  expect(koko.status()).toBe(400);
  expect((await koko.json()).error).toMatch(/not available/i);
});

test("/api/orders/<id> is admin only", async ({ request }) => {
  expect((await request.get("/api/orders/12345")).status()).toBe(401);
  expect((await request.get("/api/admin/orders")).status()).toBe(401);
});

test("old WooCommerce URLs redirect", async ({ request }) => {
  const shop = await request.get("/shop", { maxRedirects: 0 });
  expect(shop.status()).toBe(308);
  expect(shop.headers()["location"]).toContain("/categories");

  const account = await request.get("/my-account", { maxRedirects: 0 });
  expect(account.status()).toBe(308);

  const byId = await request.get("/?p=723");
  expect(byId.url()).toContain("/book/723-");
  const final = await request.get("/legacy/id/723", { maxRedirects: 0 });
  expect(final.status()).toBe(308);
  expect(final.headers()["location"]).toContain("/book/723-");

  const unknown = await request.get("/books/definitely-not-a-real-slug", { maxRedirects: 0 });
  expect(unknown.status()).toBe(308);
  expect(unknown.headers()["location"]).toContain("/categories");
});

test("sitemap contains book URLs", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("/book/");
  expect(xml).toContain("/privacy-policy");
});
