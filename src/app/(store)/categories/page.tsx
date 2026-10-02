import type { Metadata } from "next";
import { og } from "@/lib/site";
import CatalogListing from "@/components/store/CatalogListing";
import { forCards, getCatalog, getCategories, inStockFirst, paginate } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "All Books & Categories",
  description:
    "Browse every book at Rasakatha.lk by category — novels, translations, poetry, short stories, children's books and more.",
  alternates: { canonical: "/categories" },
  openGraph: og("/categories"),
};

export default async function CategoriesPage() {
  const [catalog, categories] = await Promise.all([getCatalog(), getCategories()]);
  const first = paginate(inStockFirst(catalog), 1, 24);
  return (
    <CatalogListing
      title="All Books"
      intro="Pick a category to narrow things down, or sort and filter the full collection."
      query=""
      initialItems={forCards(first.items)}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
      chips={categories.map((c) => ({ name: c.name, count: c.count }))}
    />
  );
}
