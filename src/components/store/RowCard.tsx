import type { CSSProperties } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId, discountPercent } from "@/lib/format";
import Link from "next/link";
import { bookHref } from "@/lib/links";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { AddToCartButton, WishButton } from "./islands";

// Server component: only the wishlist and add-to-cart buttons are client islands.
export default function RowCard({ book, priority = false }: { book: CatalogBook; priority?: boolean }) {
  const href = bookHref(book);
  return (
    <div
      className="group relative w-[152px] shrink-0 scroll-ml-6 text-left hover:z-10 sm:w-[168px]"
      style={{ "--glow": tintForId(book.id) } as CSSProperties}
    >
      <div
        data-cover
        className="relative z-10 transition-transform duration-[480ms] ease-[var(--ease-premium)] group-hover:-translate-y-2 group-hover:scale-[1.07]"
      >
        <div className="relative aspect-[2/3] rounded-xl border border-[var(--border)] bg-card shadow-[0_10px_24px_rgba(0,0,0,0.3)] transition-shadow duration-[480ms] ease-[var(--ease-premium)] group-hover:shadow-[0_30px_54px_-14px_var(--glow)]">
          <Link href={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
            <BookCover
              cover={book.cover || undefined}
              tint={tintForId(book.id)}
              alt=""
              className="h-full w-full"
              imgClassName="rounded-xl"
              priority={priority}
            />
          </Link>
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/85 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <WishButton
            id={book.id}
            className="absolute right-2 top-2 grid h-8 w-8 translate-y-[-4px] place-items-center rounded-full bg-black/50 opacity-0 backdrop-blur-sm transition-all duration-200 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
          />

          {!book.inStock && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/70">
              Sold out
            </span>
          )}
          {book.onSale && book.inStock && book.salePrice && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-white">
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
              <AddToCartButton
                book={book}
                className="pointer-events-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_10px_22px_-6px_rgba(239,66,56,0.9)] transition-transform duration-150 hover:scale-110 active:scale-95"
              />
            )}
          </div>
        </div>
      </div>

      <Link
        href={href}
        className="mt-2.5 block truncate text-[13px] font-semibold text-[var(--ink)] transition-colors group-hover:text-accent after:absolute after:inset-0 after:z-0 after:content-['']"
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
