import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId, discountPercent } from "@/lib/format";
import Link from "next/link";
import { bookHref } from "@/lib/links";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import { AddToCartButton, WishButton } from "./islands";

// Server component: only the wishlist and add-to-cart buttons are client islands.
export default function CatalogCard({ book, priority = false }: { book: CatalogBook; priority?: boolean }) {
  const href = bookHref(book);
  return (
    <div className="group relative flex flex-col rounded-[18px] border border-[var(--border)] bg-card p-3 pb-4 transition-all duration-[480ms] ease-[var(--ease-premium)] hover:z-10 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_-18px_rgba(0,0,0,0.35)]">
      <div data-cover className="relative z-10 transition-transform duration-[480ms] ease-[var(--ease-premium)] group-hover:scale-[1.06]">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
          <BookCover
            cover={book.cover || undefined}
            tint={tintForId(book.id)}
            alt=""
            caption="book cover"
            className="aspect-[2/3] rounded-xl"
            imgClassName="rounded-xl"
            priority={priority}
          />
        </Link>
        <WishButton
          id={book.id}
          unwishedColor="rgba(255,255,255,0.8)"
          className="absolute right-2 top-2 grid h-[30px] w-[30px] place-items-center rounded-full bg-black/45 backdrop-blur-sm"
        />
        {!book.inStock && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
            Out of stock
          </span>
        )}
        {book.inStock && book.onSale && book.salePrice && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-white">
            -{discountPercent(book.regularPrice, book.salePrice)}%
          </span>
        )}
        {book.inStock && (
          <AddToCartButton
            book={book}
            className="absolute bottom-2 right-2 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-accent text-white opacity-0 shadow-[0_10px_22px_-6px_rgba(239,66,56,0.9)] transition-all duration-200 hover:scale-110 active:scale-95 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 max-md:translate-y-0 max-md:opacity-100"
          />
        )}
      </div>
      <div className="my-[13px] inline-block self-start rounded-full bg-[var(--surface-tint-strong)] px-[9px] py-1 font-mono text-[9.5px] tracking-[0.12em] text-[var(--ink-dim)]">
        {book.category.toUpperCase()}
      </div>
      <Link href={href} className="block text-sm font-semibold leading-[1.35] text-[var(--ink)] hover:text-accent after:absolute after:inset-0 after:z-0 after:content-['']">
        {book.title}
      </Link>
      <div className="mt-1 text-xs text-[var(--ink-faint)]">{book.author}</div>
      {book.rating > 0 && <StarRating rating={book.rating} />}
      <div className="mt-auto flex items-center gap-2.5 pt-3">
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
