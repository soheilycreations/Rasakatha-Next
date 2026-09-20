import type { StoredOrder } from "@/lib/orders";
import { money, tintForId } from "@/lib/format";
import BookCover from "./BookCover";
import OrderStatusTracker from "./OrderStatusTracker";
import { IconHeart } from "./icons";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  payhere: "PayHere",
  koko: "Koko: Buy Now Pay Later",
  mintpay: "MintPay",
};

export default function ThankYouPage({
  order,
  onContinueShopping,
  onTrackOrder,
}: {
  order: StoredOrder;
  onContinueShopping: () => void;
  onTrackOrder: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <div className="thankyou-badge mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-accent/[0.12] text-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h3 className="fade-rise font-display text-2xl font-bold text-[var(--ink)]" style={{ animationDelay: "0.25s" }}>
        Thank you for your order!
      </h3>
      <p className="fade-rise mt-2 text-[14px] text-[var(--ink-dim)]" style={{ animationDelay: "0.35s" }}>
        Your order <span className="font-semibold text-[var(--ink)]">#{order.id}</span> has been placed
        successfully. We&apos;ll send updates to your phone as it&apos;s on its way.
      </p>

      <div className="fade-rise mt-8 rounded-2xl border border-[var(--border)] bg-card p-5 text-left" style={{ animationDelay: "0.45s" }}>
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <span className="text-[13px] font-semibold text-[var(--ink)]">Order #{order.id}</span>
          <span className="rounded-full bg-[var(--surface-tint-strong)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink-dim)]">
            {PAYMENT_LABELS[order.payment] ?? order.payment}
          </span>
        </div>

        <div className="my-5">
          <OrderStatusTracker status={order.status} />
        </div>

        <div className="scrollbar-none my-4 flex max-h-[220px] flex-col gap-3 overflow-y-auto border-t border-[var(--border)] pt-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <BookCover
                cover={item.cover || undefined}
                tint={tintForId(item.id)}
                alt={item.title}
                className="h-[56px] w-[40px] shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{item.title}</div>
                <div className="text-[11px] text-[var(--ink-faint)]">Qty {item.qty}</div>
              </div>
              <span className="shrink-0 text-[12.5px] font-bold text-[var(--ink)]">
                {item.price != null ? money(item.price * item.qty) : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3.5">
          <span className="text-[14px] font-semibold text-[var(--ink)]">Total Paid</span>
          <span className="text-[18px] font-extrabold text-[var(--ink)]">{money(order.total)}</span>
        </div>
      </div>

      <div className="fade-rise mt-8 flex items-center justify-center gap-3" style={{ animationDelay: "0.55s" }}>
        <button
          onClick={onTrackOrder}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--surface-tint)]"
        >
          Track My Order
        </button>
        <button
          onClick={onContinueShopping}
          className="btn-accent inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white"
        >
          Continue Shopping
        </button>
      </div>

      <p className="fade-rise mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-[var(--ink-faint)]" style={{ animationDelay: "0.65s" }}>
        <IconHeart className="h-3.5 w-3.5" />
        Thank you for supporting Sri Lankan stories.
      </p>
    </div>
  );
}
