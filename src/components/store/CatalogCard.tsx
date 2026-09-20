import { useRef } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId, displayRating } from "@/lib/format";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { IconHeart, IconCart } from "./icons";

export default function CatalogCard({
  book,
  wished,
  onToggleWish,
  onAdd,
  onOpen,
}: {
  book: CatalogBook;
  wished: boolean;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
}) {
  const coverRef = useRef<HTMLDivElement>(null);

  const handleAdd = () => {
    const rect = coverRef.current?.getBoundingClientRect();
    if (rect) triggerFlyToCart({ rect, imgSrc: book.cover, tint: tintForId(book.id) });
    onAdd(book);
  };

  return (
    <div
      onClick={() => onOpen(book)}
      className="group relative cursor-pointer rounded-[18px] border border-[var(--border)] bg-card p-3 pb-4 transition-all duration-[480ms] ease-[var(--ease-premium)] hover:z-10 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_-18px_rgba(0,0,0,0.35)]"
    >
      <div
        ref={coverRef}
        className="relative transition-transform duration-[480ms] ease-[var(--ease-premium)] group-hover:scale-[1.06]"
      >
        <BookCover
          cover={book.cover || undefined}
          tint={tintForId(book.id)}
          alt={book.title}
          caption="book cover"
          className="aspect-[2/3] rounded-xl"
          imgClassName="rounded-xl"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWish(book.id);
            }}
            className="absolute right-2 top-2 grid h-[30px] w-[30px] place-items-center rounded-full bg-black/45 backdrop-blur-sm"
            style={{ color: wished ? "#EF4238" : "rgba(255,255,255,0.8)" }}
            aria-label="Toggle wishlist"
          >
            <IconHeart className="h-[15px] w-[15px]" style={{ fill: wished ? "currentColor" : "none" }} />
          </button>
          {!book.inStock && (
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
              Out of stock
            </span>
          )}
          {book.inStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              aria-label="Add to cart"
              className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-accent text-white opacity-0 shadow-[0_10px_22px_-6px_rgba(239,66,56,0.9)] transition-all duration-200 hover:scale-110 active:scale-95 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <IconCart className="h-[18px] w-[18px]" />
            </button>
          )}
        </BookCover>
      </div>
      <div className="my-[13px] inline-block rounded-full bg-[var(--surface-tint-strong)] px-[9px] py-1 font-mono text-[9.5px] tracking-[0.12em] text-[var(--ink-dim)]">
        {book.category.toUpperCase()}
      </div>
      <div className="text-sm font-semibold leading-[1.35] text-[var(--ink)]">{book.title}</div>
      <div className="mt-1 text-xs text-[var(--ink-faint)]">{book.author}</div>
      <StarRating rating={displayRating(book.id, book.rating)} />
      <div className="mt-3 flex items-center gap-2.5">
        {book.onSale && book.salePrice ? (
          <>
            <span className="text-xs text-[var(--ink-faint)] line-through">{money(book.regularPrice)}</span>
            <span className="text-sm font-semibold text-[var(--ink)]">{money(book.salePrice)}</span>
          </>
        ) : (
          <span className="text-sm font-semibold text-[var(--ink)]">{money(book.regularPrice)}</span>
        )}
      </div>
    </div>
  );
}
