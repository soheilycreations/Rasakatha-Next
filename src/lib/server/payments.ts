import { createHash, timingSafeEqual } from "node:crypto";
import { SITE } from "@/lib/site";
import type { StoredOrder } from "@/lib/orders";

export type PaymentMethodId = "cod" | "payhere" | "koko" | "mintpay";

const md5 = (s: string) => createHash("md5").update(s).digest("hex").toUpperCase();

export function payhereConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const secret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !secret) return null;
  const sandbox = process.env.PAYHERE_SANDBOX === "true";
  return {
    merchantId,
    secret,
    sandbox,
    action: sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout",
  };
}

// Only COD and gateways that are actually configured can be chosen.
// TODO: Koko and MintPay have no integration yet. Keep ENABLE_KOKO / ENABLE_MINTPAY
// unset until the merchant accounts exist and their checkout flows are built.
export function enabledPaymentMethods(): PaymentMethodId[] {
  const methods: PaymentMethodId[] = ["cod"];
  if (payhereConfig()) methods.push("payhere");
  if (process.env.ENABLE_KOKO === "true") methods.push("koko");
  if (process.env.ENABLE_MINTPAY === "true") methods.push("mintpay");
  return methods;
}

export function formatAmount(n: number): string {
  return n.toFixed(2);
}

export type PayHereForm = { action: string; fields: Record<string, string> };

// Builds the signed POST form the browser submits to PayHere after the order is saved.
export function buildPayHereForm(order: StoredOrder): PayHereForm | null {
  const cfg = payhereConfig();
  if (!cfg) return null;
  const amount = formatAmount(order.total);
  const hash = md5(cfg.merchantId + order.id + amount + "LKR" + md5(cfg.secret));
  const [first, ...rest] = order.customer.name.trim().split(/\s+/);
  const first_item = order.items[0]?.title ?? "Books";
  return {
    action: cfg.action,
    fields: {
      merchant_id: cfg.merchantId,
      return_url: `${SITE.url}/payment/return`,
      cancel_url: `${SITE.url}/payment/cancel`,
      notify_url: `${SITE.url}/api/payments/payhere/notify`,
      order_id: order.id,
      items: order.items.length > 1 ? `${first_item} + ${order.items.length - 1} more` : first_item,
      currency: "LKR",
      amount,
      first_name: first || "Customer",
      last_name: rest.join(" ") || "-",
      email: order.customer.email,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      country: "Sri Lanka",
      hash,
    },
  };
}

// md5sig = MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret))
export function verifyPayHereNotification(p: Record<string, string>): boolean {
  const cfg = payhereConfig();
  if (!cfg || p.merchant_id !== cfg.merchantId || !p.md5sig) return false;
  const expected = md5(
    p.merchant_id + p.order_id + p.payhere_amount + p.payhere_currency + p.status_code + md5(cfg.secret)
  );
  const a = Buffer.from(expected);
  const b = Buffer.from(p.md5sig.toUpperCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
