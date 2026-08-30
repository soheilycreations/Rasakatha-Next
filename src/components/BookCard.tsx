import CoverArt from "./CoverArt";
import type { Book } from "@/lib/data";
import { IconHeart, IconStar } from "./icons";

export default function BookCard({ book }: { book: Book }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-card transition-colors hover:border-white/20">
      <div className="relative aspect-[3/4] overflow-hidden">
        <CoverArt
          cover={book.cover}
          title={book.title}
          titleSi={book.titleSi}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {book.discount && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-rose px-2 py-0.5 text-[0.68rem] font-semibold text-white">
            -{book.discount}%
          </span>
        )}
        {book.badge && !book.discount && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-accent px-2 py-0.5 text-[0.68rem] font-semibold text-accent-ink">
            {book.badge}
          </span>
        )}
        <button className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur transition-colors hover:text-rose">
          <IconHeart className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ink-faint">
          {book.category}
        </span>
        <p className="truncate text-sm font-semibold text-ink">{book.title}</p>
        <p className="truncate text-xs text-ink-dim">{book.author}</p>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {book.originalPrice && (
              <span className="text-xs text-ink-faint line-through">Rs.{book.originalPrice}</span>
            )}
            <span className="text-sm font-semibold text-accent">Rs.{book.price}</span>
          </div>
          <span className="flex items-center gap-0.5 text-xs text-ink-dim">
            <IconStar className="h-3 w-3 text-accent" /> {book.rating}
          </span>
        </div>
      </div>
    </div>
  );
}
