"use client";

import { useRef } from "react";
import { IconChevronLeft, IconChevronRight } from "./icons";

// Horizontal scroller with arrow buttons. The cards are server-rendered children.
export default function RowScroller({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => scrollerRef.current?.scrollBy({ left: dir * 640, behavior: "smooth" });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-panel to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-panel to-transparent sm:w-16" />

      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute left-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 focus-visible:opacity-100 group-hover/row:opacity-100 sm:grid"
      >
        <IconChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute right-1 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 focus-visible:opacity-100 group-hover/row:opacity-100 sm:grid"
      >
        <IconChevronRight className="h-4 w-4" />
      </button>

      <div ref={scrollerRef} className="scrollbar-none flex gap-4 overflow-x-auto scroll-smooth px-6 pb-4 pt-3 sm:gap-5 sm:px-8">
        {children}
      </div>
    </div>
  );
}
