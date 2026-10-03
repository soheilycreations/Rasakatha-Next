"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/hero-slides";
import type { CatalogBook } from "@/lib/catalog";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import { circularOffset, slideStyle } from "@/lib/hero-style";
import { IconCart, IconHeart } from "./icons";
import { useStore } from "./StoreContext";

const INTERVAL = 4200;
const SWIPE_THRESHOLD = 50;
const DRAG_THRESHOLD = 8;

// Interactive layer for the server-rendered hero (see HeroSection). `children` are the slides.
export default function HeroCarousel({
  slides,
  heroBooks,
  children,
}: {
  slides: HeroSlide[];
  // Slides whose id matches a catalog book sell that book at its real price.
  heroBooks: Record<string, CatalogBook>;
  children: React.ReactNode;
}) {
  const { wish, toggleWish, addBookToCart, openBook } = useStore();
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number } | null>(null);
  const justDragged = useRef(false);

  const n = slides.length;
  const goTo = (i: number) => setActive(((i % n) + n) % n);

  // Move the (server-rendered) slides to their new positions.
  useEffect(() => {
    rootRef.current?.querySelectorAll<HTMLElement>("[data-slide]").forEach((el) => {
      const i = Number(el.dataset.slide);
      const offset = circularOffset(i, active, n);
      Object.assign(el.style, slideStyle(offset));
      el.toggleAttribute("data-current", offset === 0);
      // slides are lazy images; fetch the neighbours of the current slide so swiping never shows a blank slide
      if (Math.abs(offset) <= 1) el.querySelector("img")?.setAttribute("loading", "eager");
    });
  }, [active, n]);

  useEffect(() => {
    // no autoplay for people who asked for reduced motion
    if (n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % n), INTERVAL);
    return () => clearTimeout(id);
  }, [active, n]);

  const startDrag = (clientX: number) => {
    dragState.current = { startX: clientX };
  };
  const endDrag = (clientX: number) => {
    const st = dragState.current;
    dragState.current = null;
    if (!st) return;
    const delta = clientX - st.startX;
    if (Math.abs(delta) >= DRAG_THRESHOLD) {
      justDragged.current = true;
      if (delta <= -SWIPE_THRESHOLD) goTo(active - 1);
      else if (delta >= SWIPE_THRESHOLD) goTo(active + 1);
    }
  };
  const onSlideClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-slide]");
    if (!el) return;
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    const i = Number(el.dataset.slide);
    if (i !== active) goTo(i);
    else if (heroBooks[slides[i].id]) openBook(heroBooks[slides[i].id]);
  };
  const activeBook = n > 0 ? heroBooks[slides[active].id] : undefined;

  return (
    <div
      ref={rootRef}
      onMouseDown={(e) => startDrag(e.clientX)}
      onMouseUp={(e) => endDrag(e.clientX)}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      onTouchEnd={(e) => endDrag(e.changedTouches[0].clientX)}
      onClick={onSlideClick}
      className="hero-root relative mx-4 mb-8 touch-pan-y select-none overflow-hidden rounded-[10px] sm:mx-8 [container-type:inline-size]"
    >
      {/* sizing box: gives the container its height (slides are absolutely positioned) */}
      <div className="mx-auto" style={{ width: "var(--hero-w)", aspectRatio: "1695 / 1020" }} />

      {children}

      {/* Buttons live outside the preserve-3d/perspective scene so peeking side
          slides can never intercept their clicks (3D depth sorting can beat z-index). */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-30 overflow-visible"
        style={{ width: "var(--hero-w)", aspectRatio: "1695 / 1020", marginLeft: "calc(var(--hero-w) / -2)" }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWish(slides[active].id);
          }}
          className="pointer-events-auto absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-6 sm:top-6 sm:h-[46px] sm:w-[46px]"
          style={{ color: wish[slides[active].id] ? "var(--accent)" : "rgba(255,255,255,0.85)" }}
          aria-label="Toggle wishlist"
        >
          <IconHeart
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            style={{ fill: wish[slides[active].id] ? "currentColor" : "none" }}
          />
        </button>

        {activeBook && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!activeBook.inStock) {
                openBook(activeBook);
                return;
              }
              triggerFlyToCart({ rect: e.currentTarget.getBoundingClientRect(), imgSrc: activeBook.cover });
              addBookToCart(activeBook);
            }}
            className="pointer-events-auto absolute bottom-5 right-4 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(239,66,56,0.7)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3 sm:text-sm max-sm:bottom-auto max-sm:left-4 max-sm:right-auto max-sm:top-4 max-sm:px-3"
          >
            <IconCart className="h-4 w-4" />
            <span className="max-sm:sr-only">{activeBook.inStock ? "Add to Cart" : "View Book"}</span>
          </button>
        )}
      </div>

      <div className="hero-fade pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-panel via-panel/70 to-transparent sm:w-24" />
      <div className="hero-fade pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-panel via-panel/70 to-transparent sm:w-24" />

      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={(e) => {
              e.stopPropagation();
              goTo(i);
            }}
            aria-label={`Show ${s.title}`}
            className="relative h-[5px] w-8 overflow-hidden rounded-full bg-white/30 p-0"
          >
            {i === active && (
              <span
                key={active}
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                style={{ animation: `slide-progress ${INTERVAL}ms linear forwards` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
