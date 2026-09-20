"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money, tintForId, displayRating, discountPercent } from "@/lib/format";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import HomeRow from "./HomeRow";
import ShareButtons from "./ShareButtons";
import ProductReviews from "./ProductReviews";
import { IconHeart, IconCart, IconChevronLeft } from "./icons";

export default function ProductView({
  bookId,
  wish,
  onToggleWish,
  onAdd,
  onOpen,
  onOpenAuthor,
  onBack,
}: {
  bookId: string;
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
  onOpenAuthor: (name: string) => void;
  onBack: () => void;
}) {
  const [book, setBook] = useState<CatalogBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      setBook(null);
    });
    fetch(`/api/books?ids=${bookId}`)
      .then((r) => r.json())
      .then((data: { items: CatalogBook[] }) => {
        setBook(data.items[0] ?? null);
        setLoading(false);
      });
  }, [bookId]);

  const handleAdd = (e?: React.MouseEvent) => {
    if (!book) return;
    const rect = (e?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect();
    if (rect) triggerFlyToCart({ rect, imgSrc: book.cover, tint: tintForId(book.id) });
    onAdd(book);
  };

  if (loading) {
    return (
      <div className="grid animate-pulse gap-8 sm:grid-cols-[minmax(0,320px)_1fr]">
        <div className="aspect-[2/3] rounded-2xl bg-[var(--surface-tint-strong)]" />
        <div className="space-y-3">
          <div className="h-6 w-3/4 rounded bg-[var(--surface-tint-strong)]" />
          <div className="h-4 w-1/3 rounded bg-[var(--surface-tint)]" />
          <div className="h-4 w-1/4 rounded bg-[var(--surface-tint)]" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="py-16 text-center text-[13.5px] text-[var(--ink-faint)]">
        Book not found.
        <button onClick={onBack} className="mt-3 block w-full font-semibold text-accent-blue">
          Go back
        </button>
      </div>
    );
  }

  const wished = !!wish[book.id];

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-dim)] transition-colors hover:text-accent"
      >
        <IconChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-8 sm:grid-cols-[minmax(0,320px)_1fr] sm:gap-12">
        <div className="relative mx-auto w-full max-w-[320px]">
          <BookCover
            cover={book.cover || undefined}
            tint={tintForId(book.id)}
            alt={book.title}
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
          <div className="mb-2 inline-block rounded-full bg-[var(--surface-tint-strong)] px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-[var(--ink-dim)]">
            {book.category.toUpperCase()}
          </div>
          <h1 className="font-display text-[26px] font-bold leading-tight text-[var(--ink)] sm:text-[32px]">
            {book.title}
          </h1>
          <button
            onClick={() => onOpenAuthor(book.author)}
            className="mt-2 text-[14.5px] font-semibold text-accent-blue transition-opacity hover:opacity-75"
          >
            {book.author}
          </button>

          <div className="mt-3">
            <StarRating rating={displayRating(book.id, book.rating)} size={15} />
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            {book.onSale && book.salePrice ? (
              <>
                <span className="text-2xl font-extrabold text-[var(--ink)]">{money(book.salePrice)}</span>
                <span className="text-base text-[var(--ink-faint)] line-through">
                  {money(book.regularPrice)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-extrabold text-[var(--ink)]">{money(book.regularPrice)}</span>
            )}
          </div>

          {book.blurb && (
            <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[var(--ink-dim)]">{book.blurb}</p>
          )}

          <div className="mt-7 flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={!book.inStock}
              className="btn-accent flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <IconCart className="h-4 w-4" />
              {book.inStock ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              onClick={() => onToggleWish(book.id)}
              aria-label="Toggle wishlist"
              className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] transition-colors hover:border-accent/40"
              style={{ color: wished ? "#EF4238" : "var(--ink-dim)" }}
            >
              <IconHeart className="h-5 w-5" style={{ fill: wished ? "currentColor" : "none" }} />
            </button>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <ShareButtons title={book.title} />
          </div>
        </div>
      </div>

      <ProductReviews bookId={book.id} />

      <div className="mt-14">
        <HomeRow
          title={`More by ${book.author}`}
          fetchUrl={`/api/books?author=${encodeURIComponent(book.author)}&limit=16`}
          wish={wish}
          onToggleWish={onToggleWish}
          onAdd={onAdd}
          onOpen={onOpen}
        />
      </div>
    </div>
  );
}
