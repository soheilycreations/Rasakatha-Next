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
  viewAllLabel = "View all",
  endTile,
  priorityCount = 0,
}: {
  title: string;
  items: CatalogBook[];
  viewAllHref?: string;
  viewAllLabel?: string;
  // a final "see all" tile after the cards
  endTile?: { href: string; label: string };
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
            {viewAllLabel}
          </Link>
        )}
      </div>

      <RowScroller>
        {items.map((book, i) => (
          <RowCard key={book.id} book={book} priority={i < priorityCount} />
        ))}
        {endTile && (
          <Link
            href={endTile.href}
            className="group/tile relative grid aspect-[2/3] w-[152px] shrink-0 place-items-center self-start rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-tint)] p-4 text-center text-[13px] font-bold text-[var(--ink)] transition-colors hover:border-accent hover:text-accent sm:w-[168px]"
          >
            <span>
              {endTile.label}
              <span aria-hidden className="ml-1 inline-block transition-transform group-hover/tile:translate-x-1">
                →
              </span>
            </span>
          </Link>
        )}
      </RowScroller>
    </section>
  );
}
