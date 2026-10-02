import { NextResponse } from "next/server";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { getByIds } from "@/lib/catalog";
import { calculateShippingFee, SRI_LANKA_LOCATIONS } from "@/lib/shipping";
import type { CartItem } from "@/lib/cart";

const MAX_ID_ATTEMPTS = 5;
const PAYMENT_METHODS = new Set(["cod", "payhere", "koko", "mintpay"]);
const DEFAULT_ITEM_WEIGHT = 303;
const KNOWN_TOWNS = new Set(SRI_LANKA_LOCATIONS.flatMap((d) => d.towns));

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawItems: unknown = body?.items;
  const payment = str(body?.payment, 20);
  const c = body?.customer ?? {};

  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (!PAYMENT_METHODS.has(payment)) {
    return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
  }

  const customer = {
    name: str(c.name, 120),
    phone: str(c.phone, 20),
    email: str(c.email, 160).toLowerCase(),
    city: str(c.city, 80),
    address: str(c.address, 500),
    isGift: !!c.isGift,
    ...(c.isGift
      ? {
          giftName: str(c.giftName, 120),
          giftPhone: str(c.giftPhone, 20),
          giftCity: str(c.giftCity, 80),
          giftAddress: str(c.giftAddress, 500),
        }
      : {}),
  };
  const deliveryCity = customer.isGift ? customer.giftCity ?? "" : customer.city;
  const phoneOk = (p: string) => p.replace(/\D/g, "").length >= 9;

  if (!customer.name || !phoneOk(customer.phone) || !/^\S+@\S+\.\S+$/.test(customer.email) || !customer.address) {
    return NextResponse.json({ error: "Please complete your contact and delivery details." }, { status: 400 });
  }
  if (!KNOWN_TOWNS.has(customer.city) || !KNOWN_TOWNS.has(deliveryCity)) {
    return NextResponse.json({ error: "Please choose a delivery city from the list." }, { status: 400 });
  }
  if (customer.isGift && (!customer.giftName || !phoneOk(customer.giftPhone ?? "") || !customer.giftAddress)) {
    return NextResponse.json({ error: "Please complete the recipient's details." }, { status: 400 });
  }

  // Never trust prices, totals or delivery fees from the browser: rebuild the
  // order from the catalog so nobody can buy a book for Rs. 1 by editing the request.
  const qtyById = new Map<string, number>();
  for (const it of rawItems as { id?: unknown; qty?: unknown }[]) {
    const id = str(it?.id, 40);
    const qty = Math.floor(Number(it?.qty));
    if (!id || !(qty >= 1 && qty <= 50)) {
      return NextResponse.json({ error: "Your cart has an invalid item. Please refresh and try again." }, { status: 400 });
    }
    qtyById.set(id, (qtyById.get(id) ?? 0) + qty);
  }

  const books = await getByIds([...qtyById.keys()]);
  if (books.length !== qtyById.size) {
    return NextResponse.json(
      { error: "Some books in your cart are no longer available. Please remove them and try again." },
      { status: 409 }
    );
  }
  const soldOut = books.filter((b) => !b.inStock);
  if (soldOut.length > 0) {
    return NextResponse.json(
      { error: `Sorry, ${soldOut.map((b) => b.title).join(", ")} just sold out. Please remove it from your cart.` },
      { status: 409 }
    );
  }

  const items: CartItem[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.cover,
    price: b.onSale && b.salePrice ? b.salePrice : b.regularPrice,
    weight: b.weight || DEFAULT_ITEM_WEIGHT,
    qty: qtyById.get(b.id)!,
  }));
  const subtotal = items.reduce((s, x) => s + (x.price ?? 0) * x.qty, 0);
  const totalWeight = items.reduce((s, x) => s + (x.weight ?? DEFAULT_ITEM_WEIGHT) * x.qty, 0);
  const deliveryFee = calculateShippingFee(deliveryCity, totalWeight);
  const total = subtotal + deliveryFee;

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = Math.floor(10000 + Math.random() * 90000).toString();
    const { data, error } = await supabase()
      .from("orders")
      .insert({
        id,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment,
        status: "processing",
        customer,
      })
      .select()
      .single();

    if (!error) return NextResponse.json(rowToOrder(data as OrderRow));
    // 23505 = unique violation: the random id collided, so try another one.
    if (error.code !== "23505") {
      return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
}
