"use client";

import type { CSSProperties } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { tintForId } from "@/lib/format";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import { useStore } from "./StoreContext";
import { IconCart, IconHeart } from "./icons";

// Small interactive islands used inside server-rendered book cards. Everything else
// on a card (cover, title, price, links) is plain server HTML.

export function WishButton({
  id,
  className,
  iconClassName = "h-[15px] w-[15px]",
  unwishedColor = "rgba(255,255,255,0.85)",
}: {
  id: string;
  className: string;
  iconClassName?: string;
  unwishedColor?: string;
}) {
  const { wish, toggleWish } = useStore();
  const wished = !!wish[id];
  return (
    <button
      type="button"
      onClick={() => toggleWish(id)}
      aria-label={wished ? "Remove from My Library" : "Save to My Library"}
      aria-pressed={wished}
      className={className}
      style={{ color: wished ? "var(--accent)" : unwishedColor } as CSSProperties}
    >
      <IconHeart className={iconClassName} style={{ fill: wished ? "currentColor" : "none" }} />
    </button>
  );
}

export function AddToCartButton({ book, className }: { book: CatalogBook; className: string }) {
  const { addBookToCart } = useStore();
  return (
    <button
      type="button"
      aria-label="Add to cart"
      className={className}
      onClick={(e) => {
        // fly the cover (the nearest [data-cover] ancestor) to the cart icon
        const cover = e.currentTarget.closest("[data-cover]");
        const rect = (cover ?? e.currentTarget).getBoundingClientRect();
        triggerFlyToCart({ rect, imgSrc: book.cover, tint: tintForId(book.id) });
        addBookToCart(book);
      }}
    >
      <IconCart className="h-[18px] w-[18px]" />
    </button>
  );
}
