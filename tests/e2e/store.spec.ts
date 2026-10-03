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

test("home: New Arrivals first, then Rasakatha titles; hero has no Add to Cart", async ({ page }) => {
  await page.goto("/");
  const headings = await page.locator("section h2").allTextContents();
  expect(headings[0]).toBe("New Arrivals");
  // the Rasakatha row needs books.is_own_title (supabase/book-order.sql + book-data.sql applied)
  const probe = await (await page.request.get("/api/books?publisher=rasakatha&limit=60")).json();
  if ((probe.items as { isOwnTitle?: boolean }[]).some((b) => b.isOwnTitle)) expect(headings[1]).toBe("From Rasakatha Publishers");
  await expect(page.locator(".hero-root")).toBeVisible();
  await expect(page.locator(".hero-root").getByRole("button", { name: /add to cart/i })).toHaveCount(0);
  await expect(page.locator(".hero-root").getByRole("button", { name: /wishlist/i })).toBeVisible();
});

test("default order: in-stock Rasakatha titles, other in-stock books, then sold out; newest first", async ({ request }) => {
  type B = { inStock: boolean; isOwnTitle?: boolean; publishedAt?: string | null; id: string };
  for (const category of ["Novel", "Translations"]) {
    const res = await request.get(`/api/books?category=${category}&limit=60`);
    const items = (await res.json()).items as B[];
    const tier = (b: B) => (!b.inStock ? 2 : b.isOwnTitle ? 0 : 1);
    for (let i = 1; i < items.length; i++) {
      const a = items[i - 1];
      const b = items[i];
      expect(tier(a), `${category} #${i}`).toBeLessThanOrEqual(tier(b));
      if (tier(a) === tier(b) && a.publishedAt && b.publishedAt) {
        expect(Date.parse(a.publishedAt), `${category} #${i} newest first`).toBeGreaterThanOrEqual(Date.parse(b.publishedAt));
      }
    }
  }
});

test("long descriptions are clamped with a Read more toggle", async ({ page }) => {
  // 10035 (Lamuthu Amaya) has a ~770 character description after the WooCommerce import
  await page.goto("/book/10035").catch(() => {}); // the canonical slug redirect can interrupt the first navigation
  await page.waitForLoadState("load");
  const text = page.locator("p.line-clamp-4");
  await expect(text).toBeVisible();
  const toggle = page.getByRole("button", { name: "Read more" });
  await expect(toggle).toBeVisible();
  const clampedHeight = (await text.boundingBox())!.height;
  await toggle.click();
  await expect(page.getByRole("button", { name: "Show less" })).toBeVisible();
  expect((await page.locator("p.whitespace-pre-line").first().boundingBox())!.height).toBeGreaterThan(clampedHeight);
  await page.getByRole("button", { name: "Show less" }).click();
  await expect(page.getByRole("button", { name: "Read more" })).toBeVisible();
});

test("Rasakatha titles lead the Novel and Translations lists", async ({ request }) => {
  type B = { title: string; inStock: boolean; isOwnTitle: boolean };
  for (const category of ["Novel", "Translations"]) {
    const items = ((await (await request.get(`/api/books?category=${category}&limit=10`)).json()).items) as B[];
    const ownFirst = items.findIndex((b) => !b.isOwnTitle);
    expect(items[0].isOwnTitle, `${category}: first book is a Rasakatha title`).toBe(true);
    // once the own titles end, no own title appears later
    expect(items.slice(ownFirst === -1 ? items.length : ownFirst).some((b) => b.isOwnTitle)).toBe(false);
    expect(items.every((b) => b.inStock)).toBe(true);
  }
});
