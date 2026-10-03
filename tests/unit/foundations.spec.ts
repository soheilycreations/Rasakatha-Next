import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { addCents, allocateCents, fromCents, money, mulCents, percentOfCents, toCents } from "../../src/lib/money";
import { can, permissionForRequest, permissionsFor, stripSensitive, ROLES } from "../../src/lib/permissions";
import { createSession, createTicket, readSession, readTicket } from "../../src/lib/server/adminAuth";
import { base32Decode, totpAt, verifyTotp, encryptSecret, decryptSecret } from "../../src/lib/server/totp";
import { hashPin, verifyPin } from "../../src/lib/server/staff";
import { buildAuditRow } from "../../src/lib/server/audit";
import { mergeSettings, DEFAULT_SETTINGS } from "../../src/lib/server/settings";
import { settingsSchema } from "../../src/lib/schemas/admin";

test.describe("money (integer cents)", () => {
  test("no floating point drift", () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(toCents(0.3));
    expect(fromCents(addCents(toCents(19.99), toCents(0.01)))).toBe(20);
    expect(mulCents(toCents(1250.5), 3)).toBe(375150);
  });
  test("percentages round to the nearest cent and parts add back up", () => {
    expect(percentOfCents(toCents(999.99), 10)).toBe(10000); // Rs. 100.00
    expect(allocateCents(10001, 3).reduce((a, b) => a + b, 0)).toBe(10001);
  });
  test("one formatter: whole rupees stay clean, cents show two decimals", () => {
    expect(money(1500)).toBe("Rs. 1,500");
    expect(money(1500.5)).toBe("Rs. 1,500.50");
    expect(() => toCents(NaN)).toThrow();
  });
});

test.describe("permission matrix", () => {
  test("a cashier cannot see settings, costs, profit, payouts or staff, and cannot delete", () => {
    for (const p of ["settings.view", "settings.edit", "costs.view", "profit.view", "payouts.view", "staff.manage", "audit.view", "books.archive", "reports.view"] as const) {
      expect(can("cashier", p), `cashier ${p}`).toBe(false);
    }
    for (const p of ["pos.use", "pos.sales.view", "search.use"] as const) expect(can("cashier", p)).toBe(true);
  });
  test("owner can do everything; manager cannot manage staff or edit settings", () => {
    expect(permissionsFor("owner").length).toBeGreaterThan(15);
    expect(can("manager", "staff.manage")).toBe(false);
    expect(can("manager", "settings.edit")).toBe(false);
    expect(can("manager", "settings.view")).toBe(true);
    expect(can("manager", "profit.view")).toBe(true);
  });
  test("routes are denied by default and mapped to a permission", () => {
    expect(permissionForRequest("/api/admin/settings", "PUT")).toBe("settings.edit");
    expect(permissionForRequest("/api/admin/settings", "GET")).toBe("settings.view");
    expect(permissionForRequest("/api/admin/books", "DELETE")).toBe("books.archive");
    expect(permissionForRequest("/api/admin/books", "POST")).toBe("books.edit");
    expect(permissionForRequest("/api/admin/some-new-endpoint", "GET")).toBe("owner-only");
    expect(permissionForRequest("/admin/staff", "GET")).toBe("staff.manage");
  });
  test("cost fields are stripped for roles without costs.view", () => {
    const row = { id: "1", costPrice: 100, cost_price: 100, price: 200 };
    expect(stripSensitive("cashier", row)).toEqual({ id: "1", price: 200 });
    expect(stripSensitive("owner", row)).toEqual(row);
  });
  test("every role has a defined permission list", () => {
    for (const r of ROLES) expect(Array.isArray(permissionsFor(r))).toBe(true);
  });
});

test.describe("sessions", () => {
  test("a signed session round-trips; tampering and expiry are rejected", async () => {
    const token = await createSession({ sid: "11111111-1111-1111-1111-111111111111", role: "cashier", name: "Test", tf: true });
    const s = await readSession(token);
    expect(s?.role).toBe("cashier");
    expect(await readSession(token.slice(0, -2) + "00")).toBeNull();
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), role: "owner" })).toString("base64url");
    expect(await readSession(`${forged}.${sig}`)).toBeNull(); // role can't be edited in the cookie
    expect(await readSession(undefined)).toBeNull();
    expect(await readSession("garbage")).toBeNull();
  });
  test("a 2FA ticket only works as a ticket", async () => {
    const ticket = await createTicket("abc");
    expect(await readTicket(ticket)).toBe("abc");
    const session = await createSession({ sid: "abc", role: "owner", name: "x", tf: true });
    expect(await readTicket(session)).toBeNull();
  });
});

test.describe("two-factor and PIN", () => {
  test("TOTP matches the RFC 6238 test vector", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // "12345678901234567890"
    expect(base32Decode(secret).toString()).toBe("12345678901234567890");
    expect(totpAt(secret, 59_000)).toBe("287082");
    expect(totpAt(secret, 1111111109_000)).toBe("081804");
  });
  test("verifyTotp accepts the neighbouring window and rejects wrong codes", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    expect(verifyTotp(secret, "287082", 59_000)).toBe(true);
    expect(verifyTotp(secret, "287082", 59_000 + 30_000)).toBe(true);
    expect(verifyTotp(secret, "287082", 59_000 + 120_000)).toBe(false);
    expect(verifyTotp(secret, "000000", 59_000)).toBe(false);
    expect(verifyTotp(secret, "abc", 59_000)).toBe(false);
  });
  test("TOTP secrets are encrypted at rest", () => {
    const enc = encryptSecret("JBSWY3DPEHPK3PXP");
    expect(enc).not.toContain("JBSWY3DPEHPK3PXP");
    expect(decryptSecret(enc)).toBe("JBSWY3DPEHPK3PXP");
    expect(decryptSecret("not.valid.data")).toBeNull();
  });
  test("PINs are hashed and verified", () => {
    const h = hashPin("4821");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(h).not.toContain("4821");
    expect(verifyPin("4821", h)).toBe(true);
    expect(verifyPin("4822", h)).toBe(false);
    expect(verifyPin("4821", null)).toBe(false);
  });
});

test.describe("audit and settings", () => {
  test("an audit row carries actor, action, entity, before/after and IP", () => {
    const row = buildAuditRow(
      { action: "books.update", entity: "book", entityId: "12", before: { price: 100 }, after: { price: 120 }, note: "price" },
      { id: "22222222-2222-2222-2222-222222222222", name: "Nimal", role: "manager" },
      "1.2.3.4"
    );
    expect(row).toMatchObject({ actor_name: "Nimal", actor_role: "manager", action: "books.update", entity: "book", entity_id: "12", ip: "1.2.3.4", before: { price: 100 }, after: { price: 120 } });
    expect(buildAuditRow({ action: "x", entity: "y" }, { id: "emergency", name: "Emergency owner", role: "owner" }, "ip").actor_id).toBeNull();
    expect(buildAuditRow({ action: "x", entity: "y" }, null, "ip").actor_name).toBe("System");
  });
  test("settings merge over defaults and validate", () => {
    const s = mergeSettings({ lowStockThreshold: 9, discountLimits: { cashier: 5 } });
    expect(s.lowStockThreshold).toBe(9);
    expect(s.discountLimits.cashier).toBe(5);
    expect(s.discountLimits.manager).toBe(DEFAULT_SETTINGS.discountLimits.manager);
    expect(s.tax.enabled).toBe(false); // tax is off by default
    expect(DEFAULT_SETTINGS.discountLimits.cashier).toBe(10);
    expect(mergeSettings({ lowStockThreshold: -5 })).toEqual(DEFAULT_SETTINGS); // invalid -> defaults
    expect(settingsSchema.safeParse({ ...DEFAULT_SETTINGS, tax: { enabled: true, rate: 150, label: "VAT" } }).success).toBe(false);
  });
});

// Guard rail: no admin write endpoint may forget to write an audit row.
test("every admin API write handler writes an audit row", () => {
  const root = path.join(process.cwd(), "src/app/api/admin");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
      else if (e.name === "route.ts") files.push(path.join(dir, e.name));
    }
  };
  walk(root);
  const writes = /export async function (POST|PUT|PATCH|DELETE)\b/;
  const missing = files.filter((f) => {
    const src = fs.readFileSync(f, "utf8");
    return writes.test(src) && !/\baudit\(/.test(src);
  });
  expect(missing.map((f) => path.relative(root, f)), "routes with write handlers but no audit() call").toEqual([]);
  expect(files.length).toBeGreaterThan(10);
});
