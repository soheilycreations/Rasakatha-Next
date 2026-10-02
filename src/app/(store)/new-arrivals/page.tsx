import type { Metadata } from "next";
import { og } from "@/lib/site";
import CatalogListing from "@/components/store/CatalogListing";
import { applyListOptions, forCards, getCatalog, paginate } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The newest Sinhala and English books at Rasakatha.lk — fresh releases from Rasakatha Publishers and more.",
  alternates: { canonical: "/new-arrivals" },
  openGraph: og("/new-arrivals"),
};

export default async function NewArrivalsPage() {
  const items = applyListOptions(await getCatalog(), "newest", true);
  const first = paginate(items, 1, 24);
  return (
    <CatalogListing
      title="New Arrivals"
      intro="Just landed on our shelves."
      query=""
      initialItems={forCards(first.items)}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
      defaultOrder="newest"
      defaultInStockOnly
    />
  );
}
