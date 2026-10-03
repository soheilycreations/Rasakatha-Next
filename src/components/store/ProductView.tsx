import Link from "next/link";
import type { CatalogBook } from "@/lib/catalog";
import { LANGUAGE_LABELS } from "@/lib/bookMeta";
import { money, tintForId, discountPercent } from "@/lib/format";
import { authorHref, categoryHref, ROUTES } from "@/lib/links";
import BookCover from "./BookCover";
import StarRating from "./StarRating";
import ShareButtons from "./ShareButtons";
import ProductReviews from "./ProductReviews";
import Footer from "./Footer";
import BookBuyArea, { BackButton, ViewItemTracker } from "./BookBuyArea";
import { IconTruck } from "./icons";

export default function ProductView({
  book,
  moreRows,
  shareUrl,
}: {
  book: CatalogBook;
  // server-rendered "More by author" / "More in category" rows
  moreRows: React.ReactNode;
  shareUrl: string;
}) {
  const price = book.onSale && book.salePrice ? book.salePrice : book.regularPrice;

  const details: [string, React.ReactNode][] = [
    ["Author", <Link key="a" href={authorHref(book.author)} className="text-accent-blue hover:opacity-75">{book.author}</Link>],
    ...(book.publisher ? ([["Publisher", book.publisher]] as [string, React.ReactNode][]) : []),
    ["Category", <Link key="c" href={categoryHref(book.category)} className="text-accent-blue hover:opacity-75">{book.category}</Link>],
    ...(book.translator ? ([["Translator", book.translator]] as [string, React.ReactNode][]) : []),
    ...(book.language ? ([["Language", LANGUAGE_LABELS[book.language]]] as [string, React.ReactNode][]) : []),
    ...(book.pages ? ([["Pages", String(book.pages)]] as [string, React.ReactNode][]) : []),
    ...(book.binding ? ([["Binding", book.binding]] as [string, React.ReactNode][]) : []),
    ...(book.publishedYear ? ([["Published", String(book.publishedYear)]] as [string, React.ReactNode][]) : []),
    ...(book.isbn ? ([["ISBN", book.isbn]] as [string, React.ReactNode][]) : []),
    ...(book.weight ? ([["Weight", `${book.weight} g`]] as [string, React.ReactNode][]) : []),
    ["Availability", book.inStock ? "In stock — ready to ship" : "Currently out of stock"],
  ];

  return (
    <div className="pt-4 max-md:pb-20">
      <ViewItemTracker book={book} price={price} />
      <div className="px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12.5px] text-[var(--ink-faint)]">
          <BackButton />
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
              priority
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
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11.5px] font-bold text-[var(--success-text)]">
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

            <BookBuyArea book={book} price={price} />

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

      <div className="mt-14">{moreRows}</div>

      <Footer />

    </div>
  );
}
