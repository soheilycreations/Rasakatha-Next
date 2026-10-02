"use client";

import type { CatalogBook } from "@/lib/catalog";
import type { HeroSlide } from "@/lib/hero-slides";
import HeroCarousel from "./HeroCarousel";
import CategoryTiles from "./CategoryTiles";
import HomeRow from "./HomeRow";
import AboutBanner from "./AboutBanner";
import TrustStrip from "./TrustStrip";
import Footer from "./Footer";
import { useCardHandlers, useStore } from "./StoreContext";

export type HomeRowData = { title: string; items: CatalogBook[]; viewAllHref?: string };

export default function HomeView({
  slides,
  heroBooks,
  rowsBeforeGenres,
  rowsAfterAbout,
  categories,
}: {
  slides: HeroSlide[];
  heroBooks: Record<string, CatalogBook>;
  rowsBeforeGenres: HomeRowData[];
  rowsAfterAbout: HomeRowData[];
  categories: { name: string; count: number; covers: string[] }[];
}) {
  const store = useStore();
  const handlers = useCardHandlers();

  return (
    <div className="pt-4">
      {/* One H1 per page for search engines; visually the hero carries the page. */}
      <h1 className="sr-only">Rasakatha.lk — buy Sinhala and English books online in Sri Lanka</h1>

      {slides.length > 0 && (
        <HeroCarousel
          slides={slides}
          heroBooks={heroBooks}
          wish={store.wish}
          onToggleWish={store.toggleWish}
          onBuy={store.addBookToCart}
          onOpen={store.openBook}
        />
      )}

      <TrustStrip />

      {rowsBeforeGenres.map((row) => (
        <HomeRow key={row.title} title={row.title} initialItems={row.items} viewAllHref={row.viewAllHref} {...handlers} />
      ))}

      <CategoryTiles categories={categories} />

      <AboutBanner />

      {rowsAfterAbout.map((row) => (
        <HomeRow key={row.title} title={row.title} initialItems={row.items} viewAllHref={row.viewAllHref} {...handlers} />
      ))}

      <Footer />
    </div>
  );
}
