// The permission matrix: the ONE place that says who may do what. Used by the proxy (route gate),
// by server actions/API handlers (requirePermission) and by the UI (to hide what you can't use).
// The UI hiding is a convenience only: every request is checked again on the server.

export const ROLES = ["owner", "manager", "cashier", "stock"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
  stock: "Stock keeper",
};

export const PERMISSIONS = [
  "dashboard.view",
  "orders.view",
  "orders.update",
  "pos.use",
  "pos.sales.view",
  "customers.view",
  "reports.view",
  "books.view",
  "books.edit",
  "books.archive",
  "authors.edit",
  "categories.edit",
  "sliders.edit",
  "reviews.moderate",
  "costs.view", // cost prices (Phase 1 adds the data)
  "profit.view",
  "payouts.view", // consignment / royalty payouts (Phase 4)
  "settings.view",
  "settings.edit",
  "staff.manage",
  "audit.view",
  "search.use",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: ALL,
  manager: ALL.filter((p) => p !== "staff.manage" && p !== "settings.edit"),
  // The till: sells, looks things up, never sees money behind the books or settings, never deletes.
  cashier: ["pos.use", "pos.sales.view", "orders.view", "customers.view", "books.view", "search.use"],
  // Stock keeper: catalog, stock and packing.
  stock: ["books.view", "books.edit", "orders.view", "orders.update", "costs.view", "search.use"],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  return !!role && MATRIX[role]?.includes(permission) === true;
}

export function permissionsFor(role: Role): readonly Permission[] {
  return MATRIX[role];
}

// Where each role lands after signing in.
export function homeFor(role: Role): string {
  return role === "cashier" ? "/admin/pos" : role === "stock" ? "/admin/books" : "/admin";
}

// ---------------------------------------------------------------------------------------------
// Route table. First matching entry wins; `methods` omitted = every method. Anything under
// /admin or /api/admin that matches nothing is owner-only (deny by default).
type RouteRule = { prefix: string; methods?: string[]; permission: Permission };

const READ = ["GET", "HEAD"];

export const ROUTE_RULES: RouteRule[] = [
  { prefix: "/api/admin/staff", permission: "staff.manage" },
  { prefix: "/admin/staff", permission: "staff.manage" },
  { prefix: "/api/admin/audit", permission: "audit.view" },
  { prefix: "/admin/audit", permission: "audit.view" },
  { prefix: "/api/admin/settings", methods: READ, permission: "settings.view" },
  { prefix: "/api/admin/settings", permission: "settings.edit" },
  { prefix: "/admin/settings", permission: "settings.view" },
  { prefix: "/api/admin/reports", permission: "reports.view" },
  { prefix: "/admin/reports", permission: "reports.view" },
  { prefix: "/api/admin/stats", permission: "dashboard.view" },
  { prefix: "/api/admin/search", permission: "search.use" },
  { prefix: "/api/admin/orders", methods: READ, permission: "orders.view" },
  { prefix: "/api/admin/orders", permission: "orders.update" },
  { prefix: "/admin/orders", permission: "orders.view" },
  { prefix: "/api/admin/pos/sales", methods: READ, permission: "pos.sales.view" },
  { prefix: "/api/admin/pos", permission: "pos.use" },
  { prefix: "/admin/pos/sales", permission: "pos.sales.view" },
  { prefix: "/admin/pos", permission: "pos.use" },
  { prefix: "/api/admin/customers", permission: "customers.view" },
  { prefix: "/admin/customers", permission: "customers.view" },
  { prefix: "/api/admin/books", methods: READ, permission: "books.view" },
  { prefix: "/api/admin/books", methods: ["DELETE", "PATCH"], permission: "books.archive" },
  { prefix: "/api/admin/books", permission: "books.edit" },
  { prefix: "/admin/books", permission: "books.view" },
  { prefix: "/api/admin/upload", permission: "books.edit" },
  { prefix: "/api/admin/publishers", methods: READ, permission: "books.view" },
  { prefix: "/api/admin/authors", methods: READ, permission: "books.view" },
  { prefix: "/api/admin/authors", permission: "authors.edit" },
  { prefix: "/admin/authors", permission: "authors.edit" },
  { prefix: "/api/admin/categories", methods: READ, permission: "books.view" },
  { prefix: "/api/admin/categories", permission: "categories.edit" },
  { prefix: "/admin/categories", permission: "categories.edit" },
  { prefix: "/api/admin/hero-slides", permission: "sliders.edit" },
  { prefix: "/admin/sliders", permission: "sliders.edit" },
  { prefix: "/api/admin/reviews", permission: "reviews.moderate" },
  { prefix: "/admin/reviews", permission: "reviews.moderate" },
];

// Pages every signed-in staff member may open, and auth endpoints handled by their own checks.
export const OPEN_FOR_SESSION = ["/admin/account", "/api/admin/me", "/api/admin/logout", "/api/admin/pin", "/api/admin/account"];

export function permissionForRequest(pathname: string, method: string): Permission | "owner-only" | "open" {
  if (OPEN_FOR_SESSION.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "open";
  if (pathname === "/admin") return "dashboard.view";
  for (const r of ROUTE_RULES) {
    if (pathname === r.prefix || pathname.startsWith(r.prefix + "/")) {
      if (!r.methods || r.methods.includes(method.toUpperCase())) return r.permission;
    }
  }
  return "owner-only";
}

// Hide cost/profit/payout fields from roles that may not see them (server serialisers call this).
export function stripSensitive<T extends Record<string, unknown>>(role: Role | undefined, row: T): T {
  if (can(role, "costs.view")) return row;
  const copy: Record<string, unknown> = { ...row };
  for (const k of ["costPrice", "cost_price", "unitCost", "unit_cost", "supplierId", "supplier_id"]) delete copy[k];
  return copy as T;
}
