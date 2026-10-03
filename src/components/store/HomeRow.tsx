"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import Link from "next/link";
import RowCard from "./RowCard";
import { IconChevronLeft, IconChevronRight } from "./icons";

export default function HomeRow({
  title,
  fetchUrl,
  wish,
  onToggleWish,
  onAdd,
  onOpen,
  viewAllHref,
  initialItems,
  excludeId,
}: {
  title: string;
  fetchUrl?: string;
  initialItems?: CatalogBook[];
  viewAllHref?: string;
  excludeId?: string;
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
}) {
  const [fetched, setFetched] = useState<CatalogBook[] | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialItems || !fetchUrl) return;
    fetch(fetchUrl)
      .then((r) => r.json())
      .then((data: { items: CatalogBook[] }) => setFetched(data.items))
      .catch(() => setFetched([]));
  }, [fetchUrl, initialItems]);

  const loading = !initialItems && fetched === null;
  const items = (initialItems ?? fetched ?? []).filter((b) => b.id !== excludeId);

  const scroll = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  };

  if (!loading && items.length === 0) return null;

  // content-visibility: rows below the fold skip layout/paint until scrolled near (less main-thread work)

  return (
    <section className="group/row relative mb-10 [contain-intrinsic-size:auto_440px] [content-visibility:auto]">
      <div className="mb-3.5 flex items-center gap-4 px-4 sm:px-8">
        <h2 className="font-display text-lg font-bold text-[var(--ink)] sm:text-xl">{title}</h2>
        <div className="flex-1" />
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-semibold text-accent-blue transition-colors hover:opacity-80"
          >
            View all
          </Link>
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
