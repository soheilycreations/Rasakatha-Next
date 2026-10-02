import { useRef } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId, discountPercent } from "@/lib/format";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import Link from "next/link";
import { bookHref } from "@/lib/links";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { IconHeart, IconCart } from "./icons";

export default function RowCard({
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

  const fly = () => {
    const rect = coverRef.current?.getBoundingClientRect();
    if (!rect) return;
    triggerFlyToCart({ rect, imgSrc: book.cover, tint: tintForId(book.id) });
  };

  const handleAdd = () => {
    fly();
    onAdd(book);
  };

  return (
    <div
      onClick={() => onOpen(book)}
      className="group relative w-[152px] shrink-0 scroll-ml-6 cursor-pointer text-left hover:z-10 sm:w-[168px]"
      style={{ "--glow": tintForId(book.id) } as React.CSSProperties}
    >
      <div
        ref={coverRef}
        className="transition-transform duration-[480ms] ease-[var(--ease-premium)] group-hover:-translate-y-2 group-hover:scale-[1.07]"
      >
        <div className="relative aspect-[2/3] rounded-xl border border-[var(--border)] bg-card shadow-[0_10px_24px_rgba(0,0,0,0.3)] transition-shadow duration-[480ms] ease-[var(--ease-premium)] group-hover:shadow-[0_30px_54px_-14px_var(--glow)]">
          <BookCover
            cover={book.cover || undefined}
            tint={tintForId(book.id)}
            alt={book.title}
            className="h-full w-full"
            imgClassName="rounded-xl"
          />
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/85 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWish(book.id);
            }}
            aria-label={wished ? "Remove from My Library" : "Save to My Library"}
            className="absolute right-2 top-2 grid h-8 w-8 translate-y-[-4px] place-items-center rounded-full bg-black/50 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100"
            style={{ color: wished ? "#EF4238" : "rgba(255,255,255,0.85)" }}
          >
            <IconHeart className="h-[15px] w-[15px]" style={{ fill: wished ? "currentColor" : "none" }} />
          </button>

          {!book.inStock && (
            <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/70">
              Sold out
            </span>
          )}
          {book.onSale && book.inStock && book.salePrice && (
            <span className="absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              -{discountPercent(book.regularPrice, book.salePrice)}%
            </span>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 items-end justify-between gap-1.5 p-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex min-w-0 flex-col leading-tight">
              {book.onSale && book.salePrice ? (
                <>
                  <span className="text-[11px] text-white/55 line-through">{money(book.regularPrice)}</span>
                  <span className="text-[13.5px] font-bold text-white">{money(book.salePrice)}</span>
                </>
              ) : (
                <span className="text-[13.5px] font-bold text-white">{money(book.regularPrice)}</span>
              )}
            </div>

            {book.inStock && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                aria-label="Add to cart"
                className="pointer-events-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_10px_22px_-6px_rgba(239,66,56,0.9)] transition-transform duration-150 hover:scale-110 active:scale-95"
              >
                <IconCart className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </div>
      </div>

      <Link
        href={bookHref(book)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen(book);
        }}
        className="mt-2.5 block truncate text-[13px] font-semibold text-[var(--ink)] transition-colors group-hover:text-accent"
      >
        {book.title}
      </Link>
      <div className="truncate text-[11.5px] text-[var(--ink-faint)]">{book.author}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        {book.onSale && book.salePrice ? (
          <>
            <span className="text-[13px] font-bold text-[var(--ink)]">{money(book.salePrice)}</span>
            <span className="text-[11px] text-[var(--ink-faint)] line-through">{money(book.regularPrice)}</span>
          </>
        ) : (
          <span className="text-[13px] font-bold text-[var(--ink)]">{money(book.regularPrice)}</span>
        )}
      </div>
      {book.rating > 0 && <StarRating rating={book.rating} />}
    </div>
  );
}
