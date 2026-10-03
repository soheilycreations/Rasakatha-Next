import { NextResponse, after } from "next/server";
import { randomInt } from "node:crypto";
import { supabase } from "@/lib/server/supabase";
import { rowToOrder, type OrderRow } from "@/lib/server/ordersDb";
import { getByIds } from "@/lib/catalog";
import { calculateShippingFee, isKnownDistrict, isKnownTown } from "@/lib/shipping";
import type { CartItem } from "@/lib/cart";
import { decrementStock } from "@/lib/server/stock";
import { notifyOrderPlaced } from "@/lib/server/notify";
import { buildPayHereForm, enabledPaymentMethods, type PaymentMethodId } from "@/lib/server/payments";
import { rateLimit } from "@/lib/server/rateLimit";

const MAX_ID_ATTEMPTS = 5;
// Readable but not guessable, e.g. RK-7QF3KD. No 0/O/1/I so it survives being read over the phone.
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newOrderId = () => "RK-" + Array.from({ length: 6 }, () => ID_ALPHABET[randomInt(ID_ALPHABET.length)]).join("");
const DEFAULT_ITEM_WEIGHT = 303;

const str = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  const limited = await rateLimit(request, "orders", 12, 600);
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const rawItems: unknown = body?.items;
  const payment = str(body?.payment, 20);
  const c = body?.customer ?? {};

  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }
  if (!enabledPaymentMethods().includes(payment as PaymentMethodId)) {
    return NextResponse.json({ error: "That payment method is not available. Please choose another." }, { status: 400 });
  }

  // A delivery place is either a town from the Sri Lanka Post list, or (fallback) a district plus a
  // town the customer typed. The fallback is priced as the standard zone and flagged for the store.
  const district = str(c.district, 40);
  const townNotInList = !!c.townNotInList;
  const giftDistrict = str(c.giftDistrict, 40);
  const giftTownNotInList = !!c.giftTownNotInList;

  const customer = {
    name: str(c.name, 120),
    phone: str(c.phone, 20),
    email: str(c.email, 160).toLowerCase(),
    city: str(c.city, 80),
    address: str(c.address, 500),
    isGift: !!c.isGift,
    ...(district ? { district } : {}),
    ...(townNotInList ? { townNotInList: true } : {}),
    ...(c.isGift
      ? {
          giftName: str(c.giftName, 120),
          giftPhone: str(c.giftPhone, 20),
          giftCity: str(c.giftCity, 80),
          giftAddress: str(c.giftAddress, 500),
          ...(giftDistrict ? { giftDistrict } : {}),
          ...(giftTownNotInList ? { giftTownNotInList: true } : {}),
        }
      : {}),
  };
  const deliveryCity = customer.isGift ? customer.giftCity ?? "" : customer.city;
  const deliveryNotInList = customer.isGift ? giftTownNotInList : townNotInList;
  const placeOk = (town: string, d: string, custom: boolean) =>
    custom ? isKnownDistrict(d) && town.length >= 2 : isKnownTown(town);
  const phoneOk = (p: string) => p.replace(/\D/g, "").length >= 9;

  if (!customer.name || !phoneOk(customer.phone) || !/^\S+@\S+\.\S+$/.test(customer.email) || !customer.address) {
    return NextResponse.json({ error: "Please complete your contact and delivery details." }, { status: 400 });
  }
  if (
    !placeOk(customer.city, district, townNotInList) ||
    (customer.isGift && !placeOk(deliveryCity, giftDistrict, giftTownNotInList))
  ) {
    return NextResponse.json({ error: "Please choose a delivery town from the list, or pick your district and type your town." }, { status: 400 });
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

  const overStock = books.find((b) => b.stockQty != null && (qtyById.get(b.id) ?? 0) > b.stockQty);
  if (overStock) {
    return NextResponse.json(
      { error: `Only ${overStock.stockQty} copies of "${overStock.title}" are left. Please reduce the quantity.` },
      { status: 409 }
    );
  }

  const items: CartItem[] = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.cover,
    price: b.onSale && b.salePrice ? b.salePrice : b.regularPrice,
    regularPrice: b.regularPrice,
    weight: b.weight || DEFAULT_ITEM_WEIGHT,
    qty: qtyById.get(b.id)!,
  }));
  const subtotal = items.reduce((s, x) => s + (x.price ?? 0) * x.qty, 0);
  const totalWeight = items.reduce((s, x) => s + (x.weight ?? DEFAULT_ITEM_WEIGHT) * x.qty, 0);
  const deliveryFee = calculateShippingFee(deliveryCity, totalWeight, { townNotInList: deliveryNotInList });
  const total = subtotal + deliveryFee;

  const paymentStatus = payment === "cod" ? "cod" : "pending";
  const baseRow = { items, subtotal, delivery_fee: deliveryFee, total, payment, status: "processing", customer };

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt++) {
    const id = newOrderId();
    let { data, error } = await supabase()
      .from("orders")
      .insert({ id, ...baseRow, payment_status: paymentStatus })
      .select()
      .single();

    // 42703 / PGRST204: supabase/payments.sql hasn't been run yet, so still take the order.
    if (error && (error.code === "42703" || error.code === "PGRST204")) {
      ({ data, error } = await supabase().from("orders").insert({ id, ...baseRow }).select().single());
    }

    if (!error) {
      const order = rowToOrder(data as OrderRow);
      after(async () => {
        await decrementStock(items.map((x) => ({ id: x.id, qty: x.qty })));
        // Online orders are announced once the payment is confirmed (PayHere notify route).
        if (payment !== "payhere") await notifyOrderPlaced(order);
      });
      // PayHere: the browser must now POST this signed form to the gateway.
      if (payment === "payhere") return NextResponse.json({ ...order, payhere: buildPayHereForm(order) });
      return NextResponse.json(order);
    }
    // 23505 = unique violation: the random id collided, so try another one.
    if (error.code !== "23505") {
      return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "We couldn't place your order. Please try again." }, { status: 500 });
}
