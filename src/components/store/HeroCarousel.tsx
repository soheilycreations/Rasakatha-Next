"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { HeroSlide } from "@/lib/hero-slides";
import type { CartItem } from "@/lib/cart";
import { triggerFlyToCart } from "@/lib/fly-to-cart";
import { IconCart, IconHeart } from "./icons";

const GAP = 26;
const INTERVAL = 4200;
const ASPECT = 1695 / 1020;
const SWIPE_THRESHOLD = 50;
const DRAG_THRESHOLD = 8;

function circularOffset(i: number, active: number, n: number) {
  let o = i - active;
  const half = n / 2;
  if (o > half) o -= n;
  else if (o < -half) o += n;
  return o;
}

export default function HeroCarousel({
  slides,
  wish,
  onToggleWish,
  onBuy,
}: {
  slides: HeroSlide[];
  wish: Record<string, boolean>;
  onToggleWish: (key: string) => void;
  onBuy: (item: Omit<CartItem, "qty">) => void;
}) {
  const [active, setActive] = useState(0);
  const [slideW, setSlideW] = useState(640);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number } | null>(null);
  const justDragged = useRef(false);

  const n = slides.length;
  const goTo = (i: number) => setActive(((i % n) + n) % n);
  const goNext = () => goTo(active + 1);
  const goPrev = () => goTo(active - 1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setSlideW(Math.min(640, Math.max(220, el.clientWidth * 0.72)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setActive((a) => (a + 1) % n), INTERVAL);
    return () => clearTimeout(id);
  }, [active, n]);

  const slideH = slideW / ASPECT;

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
      if (delta <= -SWIPE_THRESHOLD) goPrev();
      else if (delta >= SWIPE_THRESHOLD) goNext();
    }
  };
  const handleSlideClick = (i: number, isActive: boolean) => {
    if (justDragged.current) {
      justDragged.current = false;
      return;
    }
    if (!isActive) goTo(i);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => startDrag(e.clientX)}
      onMouseUp={(e) => endDrag(e.clientX)}
      onTouchStart={(e) => startDrag(e.touches[0].clientX)}
      onTouchEnd={(e) => endDrag(e.changedTouches[0].clientX)}
      className="relative mx-6 mb-10 touch-pan-y select-none overflow-hidden rounded-[10px] sm:mx-8"
      style={{ height: slideH, perspective: 1600 }}
    >
      {slides.map((s, i) => {
        const offset = circularOffset(i, active, n);
        const isActive = offset === 0;
        const hidden = Math.abs(offset) > 1;
        const dir = offset === 0 ? 0 : offset > 0 ? 1 : -1;

        return (
          <div
            key={s.id}
            onClick={() => handleSlideClick(i, isActive)}
            className="absolute left-1/2 top-0 cursor-pointer overflow-hidden rounded-[22px]"
            style={{
              width: slideW,
              height: slideH,
              marginLeft: -slideW / 2,
              zIndex: isActive ? 10 : 5 - Math.abs(offset),
              transformStyle: "preserve-3d",
              transform: isActive
                ? "translateX(0px) scale(1) rotateY(0deg) translateZ(0px)"
                : `translateX(${offset * (slideW * 0.55 + GAP)}px) scale(0.86) rotateY(${dir * -22}deg) translateZ(-140px)`,
              opacity: hidden ? 0 : isActive ? 1 : 0.55,
              filter: isActive ? "none" : "brightness(0.55)",
              pointerEvents: hidden ? "none" : "auto",
              boxShadow: isActive
                ? "0 40px 80px -24px rgba(0,0,0,0.9)"
                : "0 20px 50px -20px rgba(0,0,0,0.8)",
              transition:
                "transform 650ms cubic-bezier(0.22,0.61,0.36,1), opacity 650ms ease, filter 650ms ease, box-shadow 650ms ease",
            }}
          >
            <Image
              src={s.cover}
              alt={s.title}
              fill
              sizes="(max-width: 768px) 90vw, 640px"
              className="pointer-events-none rounded-[22px] object-cover"
              style={{ clipPath: "inset(0 round 22px)" }}
              priority={i === 0}
              draggable={false}
            />
          </div>
        );
      })}

      {/* Buttons live outside the preserve-3d/perspective scene so peeking side
          slides can never intercept their clicks (3D depth sorting can beat z-index). */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-30 overflow-visible"
        style={{ width: slideW, height: slideH, marginLeft: -slideW / 2 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWish(slides[active].id);
          }}
          className="pointer-events-auto absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-6 sm:top-6 sm:h-[46px] sm:w-[46px]"
          style={{ color: wish[slides[active].id] ? "#EF4238" : "rgba(255,255,255,0.85)" }}
          aria-label="Toggle wishlist"
        >
          <IconHeart
            className="h-[18px] w-[18px] sm:h-5 sm:w-5"
            style={{ fill: wish[slides[active].id] ? "currentColor" : "none" }}
          />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            const s = slides[active];
            triggerFlyToCart({ rect: e.currentTarget.getBoundingClientRect(), imgSrc: s.cover });
            onBuy({ id: s.id, title: s.title, author: s.author, cover: s.cover, price: s.price });
          }}
          className="pointer-events-auto absolute bottom-5 right-4 flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(239,66,56,0.7)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3 sm:text-sm"
        >
          <IconCart className="h-4 w-4" />
          Add to Cart
        </button>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-panel via-panel/70 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-panel via-panel/70 to-transparent sm:w-24" />

      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
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
