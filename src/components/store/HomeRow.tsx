import type { CatalogBook } from "@/lib/catalog";
import Link from "next/link";
import RowCard from "./RowCard";
import RowScroller from "./RowScroller";

// Server component. Only the scroll arrows (RowScroller) are client code.
// content-visibility: rows below the fold skip layout/paint until scrolled near.
export default function HomeRow({
  title,
  items,
  viewAllHref,
  priorityCount = 0,
}: {
  title: string;
  items: CatalogBook[];
  viewAllHref?: string;
  // number of leading cards whose cover images are preloaded (first row on the home page)
  priorityCount?: number;
}) {
  if (items.length === 0) return null;

  return (
    <section className="group/row relative mb-10 [contain-intrinsic-size:auto_440px] [content-visibility:auto]">
      <div className="mb-3.5 flex items-center gap-4 px-4 sm:px-8">
        <h2 className="font-display text-lg font-bold text-[var(--ink)] sm:text-xl">{title}</h2>
        <div className="flex-1" />
        {viewAllHref && (
          <Link href={viewAllHref} className="text-xs font-semibold text-accent-blue transition-colors hover:opacity-80">
            View all
          </Link>
        )}
      </div>

      <RowScroller>
        {items.map((book, i) => (
          <RowCard key={book.id} book={book} priority={i < priorityCount} />
        ))}
      </RowScroller>
    </section>
  );
}
