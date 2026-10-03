import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/server/guard";
import { supabase } from "@/lib/server/supabase";
import { searchCatalog } from "@/lib/catalog";
import { bookHref } from "@/lib/links";
import { can } from "@/lib/permissions";

// Ctrl+K palette search: books (title/author/ISBN/id), web orders and customers. Each group is only
// returned if the signed-in role may open that area.
export async function GET(request: Request) {
  const auth = await requirePermission("search.use");
  if (!auth.ok) return auth.response;
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ books: [], orders: [], customers: [] });
  const role = auth.session.role;
  const safe = q.replace(/[%,()*\\]/g, " ").trim();

  const books = can(role, "books.view")
    ? (await searchCatalog(q)).slice(0, 6).map((b) => ({ id: b.id, title: b.title, author: b.author, cover: b.cover, isbn: b.isbn, href: bookHref(b), inStock: b.inStock }))
    : [];

  let orders: { id: string; name: string; phone: string; total: number; status: string }[] = [];
  let customers: { name: string; phone: string }[] = [];
  if (can(role, "orders.view")) {
    const { data } = await supabase()
      .from("orders")
      .select("id,total,status,customer")
      .or(`id.ilike.%${safe}%,customer->>name.ilike.%${safe}%,customer->>phone.ilike.%${safe}%`)
      .order("created_at", { ascending: false })
      .limit(5);
    orders = (data ?? []).map((o) => ({ id: o.id, name: o.customer?.name ?? "", phone: o.customer?.phone ?? "", total: Number(o.total), status: o.status }));
  }
  if (can(role, "customers.view")) {
    const seen = new Set<string>();
    const [web, shop] = await Promise.all([
      supabase().from("orders").select("customer").or(`customer->>name.ilike.%${safe}%,customer->>phone.ilike.%${safe}%`).limit(20),
      supabase().from("pos_sales").select("customer_name,customer_phone").or(`customer_name.ilike.%${safe}%,customer_phone.ilike.%${safe}%`).limit(20),
    ]);
    const add = (name?: string | null, phone?: string | null) => {
      const key = (phone || name || "").replace(/\s+/g, "");
      if (!key || seen.has(key) || customers.length >= 5) return;
      seen.add(key);
      customers.push({ name: name || "", phone: phone || "" });
    };
    (web.data ?? []).forEach((r) => add(r.customer?.name, r.customer?.phone));
    (shop.data ?? []).forEach((r) => add(r.customer_name, r.customer_phone));
    customers = customers.filter((c) => c.phone || c.name);
  }
  return NextResponse.json({ books, orders, customers });
}
