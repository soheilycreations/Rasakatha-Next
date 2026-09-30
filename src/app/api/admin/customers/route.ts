import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { normalizePhone } from "@/lib/phone";
import type { OrderRow } from "@/lib/server/ordersDb";
import type { PosSaleRow } from "@/lib/server/posDb";

type CustomerSummary = {
  phone: string;
  name: string;
  email: string;
  totalSpent: number;
  webOrders: number;
  posSales: number;
  lastActivity: string;
  payments: Record<string, number>;
};

export async function GET() {
  const [ordersRes, posRes] = await Promise.all([
    supabase().from("orders").select("id, created_at, total, payment, customer"),
    supabase().from("pos_sales").select("id, created_at, total, payment, customer_name, customer_phone, customer_email"),
  ]);
  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (posRes.error) return NextResponse.json({ error: posRes.error.message }, { status: 500 });

  const byPhone = new Map<string, CustomerSummary>();

  const touch = (phone: string, name: string, email: string, total: number, payment: string, createdAt: string, source: "web" | "pos") => {
    const key = normalizePhone(phone);
    if (!key) return;
    const existing = byPhone.get(key) || {
      phone: key,
      name: "",
      email: "",
      totalSpent: 0,
      webOrders: 0,
      posSales: 0,
      lastActivity: createdAt,
      payments: {},
    };
    existing.totalSpent += total;
    existing.payments[payment] = (existing.payments[payment] || 0) + 1;
    if (source === "web") existing.webOrders += 1;
    else existing.posSales += 1;
    if (createdAt >= existing.lastActivity) {
      existing.lastActivity = createdAt;
      if (name) existing.name = name;
      if (email) existing.email = email;
    } else {
      if (!existing.name && name) existing.name = name;
      if (!existing.email && email) existing.email = email;
    }
    byPhone.set(key, existing);
  };

  for (const o of ordersRes.data as OrderRow[]) {
    touch(o.customer.phone, o.customer.name, o.customer.email, Number(o.total), o.payment, o.created_at, "web");
  }
  for (const s of posRes.data as PosSaleRow[]) {
    if (!s.customer_phone) continue;
    touch(s.customer_phone, s.customer_name || "", s.customer_email || "", Number(s.total), s.payment, s.created_at, "pos");
  }

  const customers = [...byPhone.values()].sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1));
  return NextResponse.json(customers);
}
