import { SITE } from "@/lib/site";
import { money } from "@/lib/format";
import { ORDER_STATUS_STEPS, type StoredOrder } from "@/lib/orders";
import { totalSavings } from "@/lib/savings";

// Order notifications. Every channel is optional and silently skipped when its
// env vars are missing, and failures are logged, never thrown: a broken mail
// provider must never stop an order from being placed.
//
//   Email (Resend):  RESEND_API_KEY, MAIL_FROM ("Rasakatha <orders@rasakatha.lk>"), STORE_NOTIFY_EMAIL
//   SMS (notify.lk): NOTIFYLK_USER_ID, NOTIFYLK_API_KEY, NOTIFYLK_SENDER_ID
// TODO: WhatsApp Cloud API needs pre-approved message templates from Meta; add it here once they exist.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("[notify] email failed", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("[notify] email error", err);
  }
}

// notify.lk expects 94XXXXXXXXX
function toSriLankanMsisdn(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("94") && d.length === 11) return d;
  if (d.startsWith("0") && d.length === 10) return `94${d.slice(1)}`;
  if (d.length === 9) return `94${d}`;
  return null;
}

async function sendSms(phone: string, message: string): Promise<void> {
  const userId = process.env.NOTIFYLK_USER_ID;
  const apiKey = process.env.NOTIFYLK_API_KEY;
  const senderId = process.env.NOTIFYLK_SENDER_ID;
  const to = toSriLankanMsisdn(phone);
  if (!userId || !apiKey || !senderId || !to) return;
  try {
    const body = new URLSearchParams({ user_id: userId, api_key: apiKey, sender_id: senderId, to, message });
    const res = await fetch("https://app.notify.lk/api/v1/send", { method: "POST", body });
    if (!res.ok) console.error("[notify] sms failed", res.status);
  } catch (err) {
    console.error("[notify] sms error", err);
  }
}

function itemsTable(order: StoredOrder): string {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.title)} × ${i.qty}</td><td style="padding:6px 0;text-align:right">${money((i.price ?? 0) * i.qty)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
    ${totalSavings(order.items) > 0 ? `<tr><td style="padding:6px 0;color:#047857"><b>You saved</b></td><td style="text-align:right;color:#047857"><b>${money(totalSavings(order.items))}</b></td></tr>` : ""}
    <tr><td style="padding:6px 0;color:#666">Delivery</td><td style="text-align:right;color:#666">${money(order.deliveryFee)}</td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid #ddd"><b>Total</b></td><td style="padding:8px 0;border-top:1px solid #ddd;text-align:right"><b>${money(order.total)}</b></td></tr></table>`;
}

function wrap(title: string, body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="color:#e5333f">${esc(title)}</h2>${body}
    <p style="color:#888;font-size:12px;margin-top:24px">${esc(SITE.legalName)} · ${esc(SITE.address)} · ${esc(SITE.phone)}</p></div>`;
}

const payLabel = (o: StoredOrder) =>
  o.payment === "cod" ? "Cash on Delivery" : o.paymentStatus === "paid" ? "Paid online" : "Online payment (awaiting confirmation)";

// Call once per order. COD orders notify immediately; online orders notify when
// the payment is confirmed (see the PayHere notify route).
export async function notifyOrderPlaced(order: StoredOrder): Promise<void> {
  const track = `${SITE.url}/track-order`;
  const customerHtml = wrap(
    `Thank you for your order, ${order.customer.name.split(" ")[0]}!`,
    `<p>Your order <b>#${esc(order.id)}</b> has been received. ${esc(payLabel(order))}.</p>${itemsTable(order)}
     <p>Delivering to: ${esc(order.customer.isGift ? order.customer.giftAddress ?? "" : order.customer.address)}</p>
     <p>Track it any time with your order number and phone number: <a href="${track}">${track}</a></p>`
  );
  const storeTo = process.env.STORE_NOTIFY_EMAIL ?? "";
  const storeHtml = wrap(
    `New order #${order.id} — ${money(order.total)}`,
    `<p>${esc(order.customer.name)} · ${esc(order.customer.phone)} · ${esc(order.customer.email)}<br>${esc(order.customer.address)}, ${esc(order.customer.city)}</p>
     <p>${esc(payLabel(order))}</p>${itemsTable(order)}`
  );
  await Promise.all([
    sendEmail(order.customer.email, `Order #${order.id} confirmed — Rasakatha.lk`, customerHtml),
    sendEmail(storeTo, `New order #${order.id} (${money(order.total)})`, storeHtml),
    sendSms(
      order.customer.phone,
      `Rasakatha.lk: we received your order #${order.id} (${money(order.total)})${totalSavings(order.items) > 0 ? `, you saved ${money(totalSavings(order.items))}` : ""}. Track: ${SITE.url}/track-order`
    ),
  ]);
}

export async function notifyStatusChanged(order: StoredOrder): Promise<void> {
  const label = ORDER_STATUS_STEPS.find((s) => s.key === order.status)?.label ?? order.status;
  const phone = order.customer.isGift && order.customer.giftPhone ? order.customer.giftPhone : order.customer.phone;
  await Promise.all([
    sendEmail(
      order.customer.email,
      `Order #${order.id}: ${label}`,
      wrap(`Your order is now: ${label}`, `<p>Order <b>#${esc(order.id)}</b> status update.</p><p><a href="${SITE.url}/track-order">Track your order</a></p>`)
    ),
    sendSms(phone, `Rasakatha.lk: order #${order.id} is now "${label}". Track: ${SITE.url}/track-order`),
  ]);
}
