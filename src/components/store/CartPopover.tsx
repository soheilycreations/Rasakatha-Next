import type { CartItem } from "@/lib/cart";
import { money, tintForId } from "@/lib/format";
import BookCover from "./BookCover";
import { IconCart } from "./icons";

export default function CartPopover({
  items,
  onRemove,
  onChangeQty,
  onClose,
  onViewCart,
  onCheckout,
}: {
  items: CartItem[];
  onRemove: (id: string) => void;
  onChangeQty: (id: string, delta: number) => void;
  onClose: () => void;
  onViewCart: () => void;
  onCheckout: () => void;
}) {
  const subtotal = items.reduce((sum, x) => sum + (x.price ?? 0) * x.qty, 0);

  return (
    <div
      className="popover-in absolute right-0 top-[52px] z-40 flex max-h-[75vh] w-[360px] flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-card shadow-[0_32px_70px_-18px_rgba(0,0,0,0.5)]"
      style={{ transformOrigin: "top right" }}
    >
      <div
        className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 rounded-[2px] border-l border-t border-[var(--border)] bg-card"
        aria-hidden
      />

      <div className="relative flex items-center gap-3 overflow-hidden px-[18px] py-4">
        <div className="pointer-events-none absolute inset-0 bg-accent/[0.08]" />
        <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-white">
          <IconCart className="h-4 w-4" />
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="text-[14.5px] font-bold text-[var(--ink)]">Your Cart</div>
          <div className="text-[11.5px] text-[var(--ink-faint)]">
            {items.length} item{items.length === 1 ? "" : "s"}
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              onViewCart();
              onClose();
            }}
            className="relative shrink-0 text-[12px] font-semibold text-accent-blue transition-opacity hover:opacity-75"
          >
            View cart
          </button>
        )}
      </div>

      <div className="h-px bg-[var(--border)]" />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-tint)]">
            <IconCart className="h-5 w-5 text-[var(--ink-faint)]" />
          </div>
          <p className="text-[13px] text-[var(--ink-faint)]">Your cart is empty.</p>
        </div>
      ) : (
        <div className="scrollbar-none flex-1 overflow-y-auto px-3 py-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-[var(--surface-tint)]"
            >
              <BookCover
                cover={item.cover || undefined}
                tint={tintForId(item.id)}
                alt={item.title}
                className="h-[70px] w-[50px] shrink-0 rounded-lg shadow-[0_8px_16px_-6px_rgba(0,0,0,0.4)]"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold leading-tight text-[var(--ink)]">
                  {item.title}
                </div>
                {item.author && (
                  <div className="mt-0.5 truncate text-[11px] text-[var(--ink-faint)]">{item.author}</div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface-tint-strong)] px-1 py-1">
                    <button
                      onClick={() => onChangeQty(item.id, -1)}
                      aria-label="Decrease quantity"
                      className="grid h-5 w-5 place-items-center rounded-full text-[var(--ink-dim)] transition-colors hover:bg-accent hover:text-white"
                    >
                      −
                    </button>
                    <span className="min-w-[12px] text-center text-[11.5px] font-bold text-[var(--ink)]">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onChangeQty(item.id, 1)}
                      aria-label="Increase quantity"
                      className="grid h-5 w-5 place-items-center rounded-full text-[var(--ink-dim)] transition-colors hover:bg-accent hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">
                    {item.price != null ? money(item.price * item.qty) : "—"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                aria-label="Remove from cart"
                className="h-fit shrink-0 rounded-full p-1 text-[var(--ink-faint)] opacity-0 transition-all hover:bg-[var(--surface-tint-strong)] hover:text-accent group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-tint)] p-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[var(--ink-dim)]">Subtotal</span>
            <span className="text-[17px] font-extrabold text-[var(--ink)]">{money(subtotal)}</span>
          </div>
          <button
            onClick={() => {
              onCheckout();
              onClose();
            }}
            className="btn-accent flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13.5px] font-bold text-white"
          >
            Proceed to Checkout
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
