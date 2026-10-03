import { test, expect, type APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_COOKIE, createSession } from "../../src/lib/server/adminAuth";
import type { Role } from "../../src/lib/permissions";

// Server-side permission checks (Phase 0). Sessions are signed with the real ADMIN_SESSION_SECRET (the
// tests run with the same .env.local as the server), exactly like a real login would.

const FAKE_ID = "00000000-0000-4000-8000-000000000001";
const cookie = async (role: Role, tf = true) => `${ADMIN_COOKIE}=${await createSession({ sid: FAKE_ID, role, name: `E2E ${role}`, tf })}`;
const as = async (request: APIRequestContext, role: Role, method: "get" | "put" | "post" | "delete", url: string, data?: object) =>
  request[method](url, { headers: { cookie: await cookie(role) }, data, maxRedirects: 0 });

test("no session: admin APIs answer 401 and admin pages redirect to the login", async ({ request }) => {
  for (const url of ["/api/admin/settings", "/api/admin/books", "/api/admin/orders", "/api/admin/staff", "/api/admin/audit"]) {
    expect((await request.get(url)).status(), url).toBe(401);
  }
  const page = await request.get("/admin/books", { maxRedirects: 0 });
  expect(page.status()).toBe(307);
  expect(page.headers()["location"]).toContain("/admin/login");
});

test("a forged, tampered or expired cookie is rejected", async ({ request }) => {
  const good = (await cookie("owner")).split("=")[1];
  const [body, sig] = good.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), role: "owner", name: "x" })).toString("base64url");
  for (const bad of [`${forgedBody}.${sig}`, `${body}.${"0".repeat(64)}`, "garbage", "a.b"]) {
    const res = await request.get("/api/admin/settings", { headers: { cookie: `${ADMIN_COOKIE}=${bad}` } });
    expect(res.status(), bad.slice(0, 20)).toBe(401);
  }
});

test("a cashier gets 403 on settings, staff, audit, reports and cannot archive or edit books", async ({ request }) => {
  for (const [method, url] of [
    ["get", "/api/admin/settings"],
    ["put", "/api/admin/settings"],
    ["get", "/api/admin/staff"],
    ["post", "/api/admin/staff"],
    ["get", "/api/admin/audit"],
    ["get", "/api/admin/reports"],
    ["get", "/api/admin/stats"],
    ["delete", "/api/admin/books?id=1&reason=test"],
    ["post", "/api/admin/books"],
    ["put", "/api/admin/books"],
    ["patch" as never, "/api/admin/orders"],
  ] as const) {
    const res = await request.fetch(url, { method: method.toUpperCase(), headers: { cookie: await cookie("cashier") }, data: {}, maxRedirects: 0 });
    expect(res.status(), `${method.toUpperCase()} ${url}`).toBe(403);
  }
});

test("a cashier can use the till and look things up, but never receives cost fields", async ({ request }) => {
  const books = await as(request, "cashier", "get", "/api/admin/books?limit=5");
  expect(books.status()).toBe(200);
  const body = await books.json();
  expect(body.items.length).toBeGreaterThan(0);
  for (const item of body.items) {
    expect(Object.keys(item).filter((k) => /cost|supplier/i.test(k))).toEqual([]);
  }
  expect((await as(request, "cashier", "get", "/api/admin/pos/sales")).status()).not.toBe(403);
});

test("a stock keeper manages books but cannot sell or see staff", async ({ request }) => {
  expect((await as(request, "stock", "get", "/api/admin/books?limit=1")).status()).toBe(200);
  expect((await as(request, "stock", "post", "/api/admin/pos/sales", { items: [] })).status()).toBe(403);
  expect((await as(request, "stock", "get", "/api/admin/staff")).status()).toBe(403);
});

test("an owner/manager who has not finished two-factor setup can only reach the setup page", async ({ request }) => {
  const headers = { cookie: await cookie("owner", false) };
  expect((await request.get("/api/admin/books", { headers })).status()).toBe(403);
  expect((await request.get("/api/admin/me", { headers })).status()).toBe(200);
  const page = await request.get("/admin/books", { headers, maxRedirects: 0 });
  expect(page.headers()["location"]).toContain("/admin/account?setup=1");
});

test("a cashier opening a forbidden admin page is sent back to the till", async ({ page, context }) => {
  await context.addCookies([{ name: ADMIN_COOKIE, value: (await cookie("cashier")).split("=")[1], url: "http://localhost:3100" }]);
  await page.goto("/admin/settings");
  await expect(page).toHaveURL(/\/admin\/pos/);
});

// ---- needs supabase/admin-phase-0.sql: skipped until the tables exist ---------------------------------------------
test.describe("audit trail (database)", () => {
  test("every change writes an audit row, attributed to the staff member", async ({ request }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
    const probe = await sb.from("staff").select("id").limit(1); // GET, not HEAD (HEAD hides a missing table)
    const probe2 = await sb.from("audit_log").select("id").limit(1);
    test.skip(!!probe.error || !!probe2.error, "supabase/admin-phase-0.sql has not been run yet");

    // a throw-away owner, removed at the end
    const email = `e2e-owner-${Date.now()}@example.invalid`;
    const { data: created, error } = await sb.auth.admin.createUser({ email, password: `E2e-${Date.now()}-pw!`, email_confirm: true });
    expect(error).toBeNull();
    const id = created!.user!.id;
    try {
      const ins = await sb.from("staff").insert({ id, email, full_name: "E2E Owner", role: "owner", active: true });
      expect(ins.error).toBeNull();
      const headers = { cookie: `${ADMIN_COOKIE}=${await createSession({ sid: id, role: "owner", name: "E2E Owner", tf: true })}` };

      // change 1: settings (re-save the current values, which still counts as a change)
      const current = await (await request.get("/api/admin/settings", { headers })).json();
      expect((await request.put("/api/admin/settings", { headers, data: { ...current, lowStockThreshold: current.lowStockThreshold } })).status()).toBe(200);
      // change 2: a book "update" with no real change (price/description untouched)
      const first = (await (await request.get("/api/admin/books?limit=1", { headers })).json()).items[0];
      expect((await request.put("/api/admin/books", { headers, data: { id: first.id } })).status()).toBe(200);

      const audit = await (await request.get("/api/admin/audit?actor=E2E%20Owner", { headers })).json();
      const actions = (audit.items as { action: string; actor_name: string; entity: string }[]).map((r) => r.action);
      expect(actions).toContain("settings.update");
      expect(actions).toContain("books.update");
      expect((audit.items as { actor_name: string }[]).every((r) => r.actor_name === "E2E Owner")).toBe(true);

      // the log is append-only
      const del = await sb.from("audit_log").delete().eq("actor_name", "E2E Owner");
      expect(del.error).not.toBeNull();
    } finally {
      await sb.from("staff").delete().eq("id", id);
      await sb.auth.admin.deleteUser(id);
    }
  });
});
