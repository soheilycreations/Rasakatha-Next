import type { Metadata } from "next";
import { og } from "@/lib/site";
import HomeView, { type HomeRowData } from "@/components/store/HomeView";
import { getHeroSlides } from "@/lib/server/heroSlides";
import { forCards, getByCategory, getCategories, getCatalog, getNewest, getOnSale, getOwnTitles } from "@/lib/catalog";
import { categoryHref, ROUTES } from "@/lib/links";
import type { CatalogBook } from "@/lib/catalog";

// Rebuilt in the background at most every 5 minutes (and immediately when the
// admin edits books or slides), so visitors get an instant, pre-rendered page.
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: og("/"),
};

const ROW = 10;

export default async function Home() {
  const [slides, catalog, categories] = await Promise.all([getHeroSlides(), getCatalog(), getCategories()]);
  const byId = new Map(catalog.map((b) => [b.id, b]));
  const heroBooks: Record<string, CatalogBook> = {};
  for (const s of slides) {
    const b = byId.get(s.id);
    if (b) heroBooks[s.id] = { ...b, blurb: "" };
  }

  const inStock = (items: CatalogBook[]) => forCards(items.filter((b) => b.inStock).slice(0, ROW));
  const [fromRasakatha, newest, sale, novels, poetry, children] = await Promise.all([
    getOwnTitles(ROW),
    getNewest(ROW),
    getOnSale(ROW),
    getByCategory("Novel"),
    getByCategory("Poetry"),
    getByCategory("Children"),
  ]);

  const rowsBeforeGenres: HomeRowData[] = [
    { title: "New Arrivals", items: forCards(newest), viewAllHref: ROUTES.newArrivals },
    { title: "From Rasakatha Publishers", items: inStock(fromRasakatha) },
  ];
  const rowsAfterAbout: HomeRowData[] = [
    { title: "Books on Sale", items: forCards(sale), viewAllHref: ROUTES.sale },
    { title: "Novels", items: inStock(novels), viewAllHref: categoryHref("Novel") },
    { title: "Poetry Collection", items: inStock(poetry), viewAllHref: categoryHref("Poetry") },
    { title: "Children's Books", items: inStock(children), viewAllHref: categoryHref("Children") },
  ];

  return (
    <HomeView
      slides={slides}
      heroBooks={heroBooks}
      rowsBeforeGenres={rowsBeforeGenres.filter((r) => r.items.length > 0)}
      rowsAfterAbout={rowsAfterAbout.filter((r) => r.items.length > 0)}
      categories={categories}
    />
  );
}
