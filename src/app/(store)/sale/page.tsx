import type { Metadata } from "next";
import { og } from "@/lib/site";
import CatalogListing from "@/components/store/CatalogListing";
import { forCards, getOnSale, paginate } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Books on Sale — Discounts & Offers",
  description: "Discounted Sinhala and English books at Rasakatha.lk. Limited-time offers with island-wide delivery.",
  alternates: { canonical: "/sale" },
  openGraph: og("/sale"),
};

export default async function SalePage() {
  const first = paginate(await getOnSale(), 1, 24);
  return (
    <CatalogListing
      title="Books on Sale"
      intro="Every discounted title in one place — while stocks last."
      query="category=__sale__"
      initialItems={forCards(first.items)}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
    />
  );
}
