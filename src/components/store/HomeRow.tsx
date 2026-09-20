"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import RowCard from "./RowCard";
import { IconChevronLeft, IconChevronRight } from "./icons";

export default function HomeRow({
  title,
  fetchUrl,
  wish,
  onToggleWish,
  onAdd,
  onOpen,
  onViewAll,
}: {
  title: string;
  fetchUrl: string;
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
  onViewAll?: () => void;
}) {
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(fetchUrl)
      .then((r) => r.json())
      .then((data: { items: CatalogBook[] }) => {
        setItems(data.items);
        setLoading(false);
      });
  }, [fetchUrl]);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="group/row relative mb-10">
      <div className="mb-3.5 flex items-center gap-4 px-6 sm:px-8">
        <h3 className="font-display text-lg font-bold text-[var(--ink)] sm:text-xl">{title}</h3>
        <div className="flex-1" />
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-accent-blue transition-colors hover:opacity-80"
          >
            View all
          </button>
        )}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-panel to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-panel to-transparent sm:w-16" />

        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/row:opacity-100 sm:grid"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/row:opacity-100 sm:grid"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollerRef}
          className="scrollbar-none flex gap-4 overflow-x-auto scroll-smooth px-6 pb-4 pt-3 sm:gap-5 sm:px-8"
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-[152px] shrink-0 sm:w-[168px]">
                  <div className="aspect-[2/3] animate-pulse rounded-xl bg-[var(--surface-tint-strong)]" />
                  <div className="mt-2.5 h-3 w-4/5 animate-pulse rounded bg-[var(--surface-tint-strong)]" />
                </div>
              ))
            : items.map((book) => (
                <RowCard
                  key={book.id}
                  book={book}
                  wished={!!wish[book.id]}
                  onToggleWish={onToggleWish}
                  onAdd={onAdd}
                  onOpen={onOpen}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
