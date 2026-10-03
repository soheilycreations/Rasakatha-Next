import { NextResponse } from "next/server";
import { audit } from "@/lib/server/audit";
import { parseBody } from "@/lib/server/validate";
import { posSaleSchema } from "@/lib/schemas/admin";
import { supabase } from "@/lib/server/supabase";
import { rowToPosSale, type PosSaleRow } from "@/lib/server/posDb";
import type { PosSaleItem, PosPaymentMethod } from "@/lib/pos";

const MAX_ID_ATTEMPTS = 5;
const VALID_PAYMENTS: PosPaymentMethod[] = ["cash", "card", "other"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Number(searchParams.get("limit") || "100")) || 100;

  const { data, error } = await supabase()
    .from("pos_sales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data as PosSaleRow[]).map(rowToPosSale));
}

export async function POST(request: Request) {
  const parsedBody = await parseBody(request, posSaleSchema);
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.data;
  const items = body.items as unknown as PosSaleItem[];
  const discount = Number(body.discount) || 0;
  const payment = VALID_PAYMENTS.includes(body.payment as PosPaymentMethod) ? (body.payment as PosPaymentMethod) : "cash";
  const customerName = body.customerName?.trim() || null;
  const customerPhone = body.customerPhone?.trim() || null;
  const customerEmail = body.customerEmail?.trim().toLowerCase() || null;
  const note = body.note?.trim() || null;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Add at least one item to the bill" }, { status: 400 });
  }
  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const total = Math.max(0, subtotal - discount);

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = `P${Math.floor(10000 + Math.random() * 90000)}`;
    const { data, error } = await supabase()
      .from("pos_sales")
      .insert({
        id,
        items,
        subtotal,
        discount,
        total,
        payment,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        note,
      })
      .select()
      .single();

    if (!error) {
      await audit({ action: "pos.sale", entity: "pos_sale", entityId: id, after: { total, payment, discount, items: items.length, customer: customerName } });
      return NextResponse.json(rowToPosSale(data as PosSaleRow));
    }
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Could not complete the sale, try again" }, { status: 500 });
}
