import type { CartItem } from "@/lib/cart";
import { money, tintForId } from "@/lib/format";
import BookCover from "./BookCover";
import { IconCart } from "./icons";

export default function CartPage({
  items,
  onRemove,
  onChangeQty,
  onCheckout,
  onContinueShopping,
}: {
  items: CartItem[];
  onRemove: (id: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}) {
  const subtotal = items.reduce((sum, x) => sum + (x.price ?? 0) * x.qty, 0);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--surface-tint)]">
          <IconCart className="h-7 w-7 text-[var(--ink-faint)]" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-[var(--ink)]">Your cart is empty</h3>
          <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
            Looks like you haven&apos;t added any books yet.
          </p>
        </div>
        <button onClick={onContinueShopping} className="btn-accent rounded-full px-6 py-2.5 text-sm font-bold text-white">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display mb-6 text-xl font-bold text-[var(--ink)]">
        Your Cart <span className="font-sans text-sm font-normal text-[var(--ink-faint)]">({items.length} items)</span>
      </h3>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-[var(--border)] bg-card p-3.5"
            >
              <BookCover
                cover={item.cover || undefined}
                tint={tintForId(item.id)}
                alt={item.title}
                className="h-[110px] w-[78px] shrink-0 rounded-xl shadow-[0_10px_20px_-8px_rgba(0,0,0,0.4)]"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="truncate text-[15px] font-semibold text-[var(--ink)]">{item.title}</div>
                  {item.author && (
                    <div className="mt-0.5 truncate text-[12.5px] text-[var(--ink-faint)]">{item.author}</div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface-tint-strong)] px-1.5 py-1">
                    <button
                      onClick={() => onChangeQty(item.id, -1)}
                      aria-label="Decrease quantity"
                      className="grid h-6 w-6 place-items-center rounded-full text-[var(--ink-dim)] transition-colors hover:bg-accent hover:text-white"
                    >
                      −
                    </button>
                    <span className="min-w-[14px] text-center text-[12.5px] font-bold text-[var(--ink)]">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onChangeQty(item.id, 1)}
                      aria-label="Increase quantity"
                      className="grid h-6 w-6 place-items-center rounded-full text-[var(--ink-dim)] transition-colors hover:bg-accent hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[15px] font-bold text-[var(--ink)]">
                    {item.price != null ? money(item.price * item.qty) : "—"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                aria-label="Remove from cart"
                className="h-fit shrink-0 rounded-full p-1.5 text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-tint-strong)] hover:text-accent"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={onContinueShopping}
            className="mt-1 self-start text-[13px] font-semibold text-accent-blue transition-opacity hover:opacity-75"
          >
            ← Continue Shopping
          </button>
        </div>

        <div className="sticky top-4 h-fit rounded-2xl border border-[var(--border)] bg-card p-5">
          <h4 className="mb-4 text-[15px] font-bold text-[var(--ink)]">Order Summary</h4>
          <div className="flex items-center justify-between text-[13.5px] text-[var(--ink-dim)]">
            <span>Subtotal</span>
            <span className="text-[var(--ink)]">{money(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[13.5px] text-[var(--ink-dim)]">
            <span>Delivery</span>
            <span className="text-[var(--ink)]">Calculated at checkout</span>
          </div>
          <div className="my-4 h-px bg-[var(--border)]" />
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[var(--ink)]">Total</span>
            <span className="text-[20px] font-extrabold text-[var(--ink)]">{money(subtotal)}</span>
          </div>
          <button
            onClick={onCheckout}
            className="btn-accent mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[13.5px] font-bold text-white"
          >
            Proceed to Checkout
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
