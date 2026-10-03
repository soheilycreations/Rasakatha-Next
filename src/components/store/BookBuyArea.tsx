"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId } from "@/lib/format";
import { ROUTES } from "@/lib/links";
import { trackViewItem } from "@/lib/analytics";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import { useStore } from "./StoreContext";
import { IconHeart, IconCart, IconChevronLeft } from "./icons";

// Client islands for the (server-rendered) book page.

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else router.push(ROUTES.home);
      }}
      className="flex items-center gap-1 font-semibold text-[var(--ink-dim)] transition-colors hover:text-accent"
    >
      <IconChevronLeft className="h-4 w-4" />
      Back
    </button>
  );
}

export function ViewItemTracker({ book, price }: { book: Pick<CatalogBook, "id" | "title" | "category">; price: number }) {
  useEffect(() => {
    trackViewItem({ id: book.id, title: book.title, price, category: book.category });
  }, [book.id, book.title, book.category, price]);
  return null;
}

// Quantity stepper, Add to Cart, Buy Now, wishlist, and the mobile sticky bar share one quantity.
export default function BookBuyArea({ book, price }: { book: CatalogBook; price: number }) {
  const router = useRouter();
  const store = useStore();
  const [qty, setQty] = useState(1);
  const wished = !!store.wish[book.id];

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    triggerFlyToCart({ rect, imgSrc: book.cover, tint: tintForId(book.id) });
    for (let i = 0; i < qty; i++) store.addBookToCart(book);
  };

  const buyNow = () => {
    if (!store.cart.some((x) => x.id === book.id)) {
      for (let i = 0; i < qty; i++) store.addBookToCart(book);
    }
    router.push(ROUTES.checkout);
  };

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {book.inStock && (
          <div className="flex h-[50px] items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] px-1.5">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              −
            </button>
            <span className="w-7 text-center text-[14px] font-bold text-[var(--ink)]" aria-live="polite">
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => Math.min(20, q + 1))}
              aria-label="Increase quantity"
              className="grid h-9 w-9 place-items-center rounded-full text-lg text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              +
            </button>
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={!book.inStock}
          className="btn-accent flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconCart className="h-4 w-4" />
          {book.inStock ? "Add to Cart" : "Out of Stock"}
        </button>
        {book.inStock && (
          <button
            onClick={buyNow}
            className="rounded-full border border-[var(--border-strong)] px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition-colors hover:border-accent hover:text-accent"
          >
            Buy Now
          </button>
        )}
        <button
          onClick={() => store.toggleWish(book.id)}
          aria-label={wished ? "Remove from My Library" : "Save to My Library"}
          aria-pressed={wished}
          className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] transition-colors hover:border-accent/40"
          style={{ color: wished ? "var(--accent)" : "var(--ink-dim)" }}
        >
          <IconHeart className="h-5 w-5" style={{ fill: wished ? "currentColor" : "none" }} />
        </button>
      </div>

      {/* Mobile: keep the buy button in reach above the bottom nav. */}
      {book.inStock && (
        <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-[var(--border)] bg-[var(--panel)]/95 px-4 py-2.5 backdrop-blur-md md:hidden">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] text-[var(--ink-dim)]">{book.title}</div>
            <div className="text-[16px] font-extrabold text-[var(--ink)]">{money(price)}</div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="btn-accent flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-bold text-white"
          >
            <IconCart className="h-4 w-4" />
            Add to Cart
          </button>
        </div>
      )}
    </>
  );
}
