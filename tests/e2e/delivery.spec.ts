import { test, expect, type Page } from "@playwright/test";

// Delivery locations, shipping zones, the cart/checkout layout and savings display.
// None of these tests creates an order.

// The zones that existed before the full Sri Lanka Post list. They must never change.
const OLD_ZONES: Record<string, string> = {
  Colombo: "A", Narahempita: "A", "Slave Island": "A",
  Battaramulla: "B", Dehiwala: "B", Kalubowila: "B", "Mount Lavinia": "B", Nawala: "B", Nugegoda: "B",
  Rajagiriya: "B", Ratmalana: "B", "Sri Jayawardenepura Kotte": "B", Welikada: "B", Attidiya: "B",
  Athurugiriya: "C", Avissawella: "C", Boralesgamuwa: "C", Homagama: "C", Kaduwela: "C", Kesbewa: "C",
  Kottawa: "C", Maharagama: "C", Malabe: "C", Pannipitiya: "C", Piliyandala: "C",
  Jaffna: "D", Ampara: "D", Batticaloa: "D", Kataragama: "D", Pussellawa: "D",
};
const FEE_FIRST_KG = { A: 350, B: 400, C: 450, D: 500, REST: 450 } as const;

const quote = async (request: import("@playwright/test").APIRequestContext, q: string) => {
  const res = await request.get(`/api/shipping/quote?${q}`);
  return { status: res.status(), body: await res.json() };
};

test("existing courier zones and prices are unchanged", async ({ request }) => {
  for (const [town, zone] of Object.entries(OLD_ZONES)) {
    const { body } = await quote(request, `town=${encodeURIComponent(town)}&grams=300`);
    expect(body.zone, town).toBe(zone);
    expect(body.fee, town).toBe(FEE_FIRST_KG[zone as keyof typeof FEE_FIRST_KG]);
  }
});

test("zone A, zone B and far towns", async ({ request }) => {
  expect((await quote(request, "town=Colombo&grams=300")).body).toMatchObject({ zone: "A", fee: 350 });
  expect((await quote(request, "town=Colombo&grams=1500")).body).toMatchObject({ zone: "A", fee: 450 });
  expect((await quote(request, "town=Nugegoda&grams=300")).body).toMatchObject({ zone: "B", fee: 400 });
  // not zoned: standard (REST) price
  expect((await quote(request, "town=Point%20Pedro&grams=300")).body).toMatchObject({ zone: "REST", fee: 450 });
  expect((await quote(request, "town=Mullaitivu&grams=300")).body).toMatchObject({ zone: "REST", fee: 450 });
  // the list is complete: a small town that was never in the old list works
  expect((await quote(request, "town=Mawanella&grams=300")).status).toBe(200);
});

test("a town that is not in the list: district + typed town, standard zone", async ({ request }) => {
  const ok = await quote(request, "town=Some%20Village&district=Jaffna&custom=1&grams=300");
  expect(ok.status).toBe(200);
  expect(ok.body).toMatchObject({ zone: "REST", fee: 450 });
  expect((await quote(request, "town=Some%20Village&district=Nowhere&custom=1")).status).toBe(404);
  expect((await quote(request, "town=Not%20A%20Town")).status).toBe(404);
});

test("order API rejects unknown towns and bad fallbacks", async ({ request }) => {
  const books = (await (await request.get("/api/books?instock=1&limit=1")).json()).items as { id: string }[];
  const base = { name: "Test", phone: "0771234567", email: "t@example.com", address: "1 Test Rd", isGift: false };
  const items = [{ id: books[0].id, qty: 1 }];
  const post = (customer: object) => request.post("/api/orders", { data: { items, payment: "cod", customer: { ...base, ...customer } } });
  expect((await post({ city: "Not A Real Town" })).status()).toBe(400);
  expect((await post({ city: "Somewhere", district: "Atlantis", townNotInList: true })).status()).toBe(400);
  expect((await post({ city: "", district: "Jaffna", townNotInList: true })).status()).toBe(400);
});

async function seedCart(page: Page, items: object[]) {
  await page.addInitScript((value) => localStorage.setItem("rasakatha:cart", JSON.stringify(value)), items);
}
const LONG_TITLE = "ශ්‍රී ලංකාවේ ඉතිහාසය පිළිබඳ ඉතා දීර්ඝ සිංහල පොතක නම මෙහි ලියා ඇත්තේ පිරිසැලසුම බිඳ නොවැටිය යුතු බව පෙන්වීමට | A very long English half of the title that should wrap";
const CART = [
  { id: "1", title: LONG_TITLE, author: "Author Name", price: 800, regularPrice: 1000, weight: 300, qty: 2 },
  { id: "2", title: "Short title", author: "A", price: 500, regularPrice: 500, weight: 300, qty: 1 },
];

for (const width of [1024, 1280, 1366, 1440, 390]) {
  for (const path of ["/cart", "/checkout"]) {
    test(`no horizontal overflow at ${width}px on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await seedCart(page, CART);
      await page.goto(path);
      await page.waitForLoadState("load");
      await expect(page.getByText("Order Summary")).toBeVisible();
      const m = await page.evaluate(() => {
        const card = [...document.querySelectorAll("h4")].find((h) => h.textContent === "Order Summary")!.parentElement!;
        const r = card.getBoundingClientRect();
        const scroller = document.querySelector(".overflow-y-auto") as HTMLElement | null;
        return {
          docOverflow: document.documentElement.scrollWidth - window.innerWidth,
          scrollerOverflow: scroller ? scroller.scrollWidth - scroller.clientWidth : 0,
          cardRight: r.right,
          vw: window.innerWidth,
        };
      });
      expect(m.docOverflow, "page scrolls horizontally").toBeLessThanOrEqual(0);
      expect(m.cardRight, "summary card is cut off").toBeLessThanOrEqual(m.vw);
    });
  }
}

test("savings are shown in cart and checkout", async ({ page }) => {
  await seedCart(page, CART);
  await page.goto("/cart");
  await expect(page.getByText("You save", { exact: false }).first()).toBeVisible();
  // 2 x (1000 - 800) = 400
  await expect(page.getByText(/You save\s*Rs\.?\s*400/)).toBeVisible();
  await expect(page.locator(".line-through").first()).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByText(/You save\s*Rs\.?\s*400/)).toBeVisible();
});

test("checkout town search: name, postal code, typos and Singlish", async ({ page }) => {
  await seedCart(page, CART);
  await page.goto("/checkout");
  const box = page.getByRole("combobox", { name: "Delivery city or town" });
  const option = (name: RegExp) => page.getByRole("option", { name });

  await box.fill("10250"); // postal code
  await expect(option(/Nugegoda — Colombo/)).toBeVisible();
  await box.fill("nugegodaa"); // typo
  await expect(option(/Nugegoda — Colombo/)).toBeVisible();
  await box.fill("kolamba"); // Singlish
  await expect(option(/^Colombo — Colombo/).first()).toBeVisible();
  await box.fill("jaffna");
  await expect(option(/Jaffna — Jaffna/).first()).toBeVisible();

  await box.fill("nugegoda");
  await option(/Nugegoda — Colombo/).first().click();
  // zone B: 400 for the first kg
  await expect(page.getByText("Delivery (Nugegoda)")).toBeVisible();
  await expect(page.getByText(/Rs\.?\s*400(\.00)?$/).first()).toBeVisible();
});

test("checkout fallback: pick the district and type the town", async ({ page }) => {
  await seedCart(page, CART);
  await page.goto("/checkout");
  const box = page.getByRole("combobox", { name: "Delivery city or town" });
  await box.fill("zzzzqq");
  await page.getByTestId("town-not-listed").click();
  await page.getByLabel("District").selectOption("Jaffna");
  await page.getByLabel("Your town or city").fill("My Little Village");
  await expect(page.getByText("Delivery (My Little Village)")).toBeVisible();
  // standard zone price (450 for the first kg)
  await expect(page.getByText(/Rs\.?\s*450(\.00)?$/).first()).toBeVisible();
});
