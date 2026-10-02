"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId, discountPercent } from "@/lib/format";
import { authorHref, categoryHref, ROUTES } from "@/lib/links";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import HomeRow from "./HomeRow";
import ShareButtons from "./ShareButtons";
import ProductReviews from "./ProductReviews";
import Footer from "./Footer";
import { useCardHandlers, useStore } from "./StoreContext";
import { IconHeart, IconCart, IconChevronLeft, IconTruck } from "./icons";

export default function ProductView({
  book,
  moreByAuthor,
  related,
  shareUrl,
}: {
  book: CatalogBook;
  moreByAuthor: CatalogBook[];
  related: CatalogBook[];
  shareUrl: string;
}) {
  const router = useRouter();
  const store = useStore();
  const handlers = useCardHandlers();
  const [qty, setQty] = useState(1);

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

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(ROUTES.home);
  };

  const wished = !!store.wish[book.id];
  const price = book.onSale && book.salePrice ? book.salePrice : book.regularPrice;

  const details: [string, React.ReactNode][] = [
    ["Author", <Link key="a" href={authorHref(book.author)} className="text-accent-blue hover:opacity-75">{book.author}</Link>],
    ...(book.publisher ? ([["Publisher", book.publisher]] as [string, React.ReactNode][]) : []),
    ["Category", <Link key="c" href={categoryHref(book.category)} className="text-accent-blue hover:opacity-75">{book.category}</Link>],
    ...(book.weight ? ([["Weight", `${book.weight} g`]] as [string, React.ReactNode][]) : []),
    ["Availability", book.inStock ? "In stock — ready to ship" : "Currently out of stock"],
  ];

  return (
    <div className="pt-4">
      <div className="px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12.5px] text-[var(--ink-faint)]">
          <button
            onClick={goBack}
            className="flex items-center gap-1 font-semibold text-[var(--ink-dim)] transition-colors hover:text-accent"
          >
            <IconChevronLeft className="h-4 w-4" />
            Back
          </button>
          <span aria-hidden>·</span>
          <Link href="/" className="hover:text-accent">Home</Link>
          <span aria-hidden>/</span>
          <Link href={categoryHref(book.category)} className="hover:text-accent">{book.category}</Link>
        </nav>

        <div className="grid gap-8 sm:grid-cols-[minmax(0,320px)_1fr] sm:gap-12">
          <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[320px]">
            <BookCover
              cover={book.cover || undefined}
              tint={tintForId(book.id)}
              alt={`${book.title} by ${book.author} — book cover`}
              className="aspect-[2/3] rounded-2xl border border-[var(--border)] shadow-[0_28px_60px_-24px_rgba(0,0,0,0.5)]"
              imgClassName="rounded-2xl"
            />
            {!book.inStock && (
              <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/80">
                Out of stock
              </span>
            )}
            {book.onSale && book.inStock && book.salePrice && (
              <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-[11px] font-extrabold text-white">
                -{discountPercent(book.regularPrice, book.salePrice)}%
              </span>
            )}
          </div>

          <div className="min-w-0">
            <Link
              href={categoryHref(book.category)}
              className="mb-2 inline-block rounded-full bg-[var(--surface-tint-strong)] px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-[var(--ink-dim)] hover:text-accent"
            >
              {book.category.toUpperCase()}
            </Link>
            <h1 className="font-display text-[26px] font-bold leading-tight text-[var(--ink)] sm:text-[32px]">
              {book.title}
            </h1>
            <Link
              href={authorHref(book.author)}
              className="mt-2 inline-block text-[14.5px] font-semibold text-accent-blue transition-opacity hover:opacity-75"
            >
              {book.author}
            </Link>

            {book.rating > 0 && (
              <div className="mt-3">
                <StarRating rating={book.rating} size={15} />
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-extrabold text-[var(--ink)]">{money(price)}</span>
              {book.onSale && book.salePrice && (
                <>
                  <span className="text-base text-[var(--ink-faint)] line-through">{money(book.regularPrice)}</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11.5px] font-bold text-emerald-500">
                    You save {money(book.regularPrice - book.salePrice)}
                  </span>
                </>
              )}
            </div>

            {book.blurb && (
              <p className="mt-5 max-w-xl whitespace-pre-line text-[14px] leading-relaxed text-[var(--ink-dim)]">
                {book.blurb}
              </p>
            )}

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
                style={{ color: wished ? "#EF4238" : "var(--ink-dim)" }}
              >
                <IconHeart className="h-5 w-5" style={{ fill: wished ? "currentColor" : "none" }} />
              </button>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] p-3.5 text-[12.5px] text-[var(--ink-dim)]">
              <IconTruck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>
                Island-wide delivery · Cash on Delivery available ·{" "}
                <Link href={ROUTES.delivery} className="font-semibold text-accent-blue hover:opacity-75">
                  Delivery &amp; returns
                </Link>
              </span>
            </div>

            <dl className="mt-6 grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
              {details.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[var(--ink-faint)]">{k}</dt>
                  <dd className="text-[var(--ink)]">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <ShareButtons title={book.title} url={shareUrl} />
            </div>
          </div>
        </div>

        <ProductReviews bookId={book.id} />
      </div>

      <div className="mt-14">
        {moreByAuthor.length > 0 && (
          <HomeRow
            title={`More by ${book.author}`}
            initialItems={moreByAuthor}
            viewAllHref={moreByAuthor.length >= 8 ? authorHref(book.author) : undefined}
            {...handlers}
          />
        )}
        {related.length > 0 && (
          <HomeRow
            title={`More in ${book.category}`}
            initialItems={related}
            viewAllHref={categoryHref(book.category)}
            {...handlers}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
