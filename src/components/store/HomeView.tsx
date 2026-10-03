import type { CatalogBook } from "@/lib/catalog";
import type { HeroSlide } from "@/lib/hero-slides";
import HeroSection from "./HeroSection";
import CategoryTiles from "./CategoryTiles";
import HomeRow from "./HomeRow";
import AboutBanner from "./AboutBanner";
import TrustStrip from "./TrustStrip";
import Footer from "./Footer";

export type HomeRowData = { title: string; items: CatalogBook[]; viewAllHref?: string };

// Server component: everything is rendered as HTML; only small islands (wishlist/cart
// buttons, row arrows, the hero carousel) ship client code.
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
  return (
    <div className="pt-4">
      {/* One H1 per page for search engines; visually the hero carries the page. */}
      <h1 className="sr-only">Rasakatha.lk — buy Sinhala and English books online in Sri Lanka</h1>

      {slides.length > 0 && <HeroSection slides={slides} heroBooks={heroBooks} />}

      <TrustStrip />

      {rowsBeforeGenres.map((row, i) => (
        <HomeRow key={row.title} title={row.title} items={row.items} viewAllHref={row.viewAllHref} priorityCount={i === 0 ? 3 : 0} />
      ))}

      <CategoryTiles categories={categories} />

      <AboutBanner />

      {rowsAfterAbout.map((row) => (
        <HomeRow key={row.title} title={row.title} items={row.items} viewAllHref={row.viewAllHref} />
      ))}

      <Footer />
    </div>
  );
}
