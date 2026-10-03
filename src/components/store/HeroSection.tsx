import Image from "next/image";
import type { HeroSlide } from "@/lib/hero-slides";
import type { CatalogBook } from "@/lib/catalog";
import { circularOffset, slideStyle } from "@/lib/hero-style";
import HeroCarousel from "./HeroCarousel";

// Server component: renders every slide as HTML in its initial (slide 0 active) position,
// with the first image preloaded (priority + fetchPriority high). HeroCarousel is a small
// client island that only adds autoplay, swipe, dots and the buttons; it never replaces the DOM.
export default function HeroSection({ slides, heroBooks }: { slides: HeroSlide[]; heroBooks: Record<string, CatalogBook> }) {
  const n = slides.length;
  if (n === 0) return null;
  return (
    <HeroCarousel slides={slides} heroBooks={heroBooks}>
      {slides.map((s, i) => (
        <div
          key={s.id}
          data-slide={i}
          className="absolute left-1/2 top-0 cursor-pointer overflow-hidden rounded-[22px]"
          style={slideStyle(circularOffset(i, 0, n))}
        >
          <Image
            src={s.cover}
            alt={s.title}
            fill
            sizes="(max-width: 767px) 68vw, 640px"
            className="pointer-events-none rounded-[22px] object-cover"
            style={{ clipPath: "inset(0 round 22px)" }}
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : undefined}
            draggable={false}
          />
        </div>
      ))}
    </HeroCarousel>
  );
}
