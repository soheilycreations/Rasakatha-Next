import type { Metadata } from "next";
import { og } from "@/lib/site";
import CatalogListing from "@/components/store/CatalogListing";
import CatalogGrid from "@/components/store/CatalogGrid";
import { forCards, getAllOwnTitles, paginate } from "@/lib/catalog";

export const revalidate = 300;

const PATH = "/rasakatha-publishers";

export const metadata: Metadata = {
  title: "Rasakatha Publishers — Our Books",
  description:
    "Every book published by Rasakatha Publishers: Sinhala novels, translations, poetry and more. Buy online at Rasakatha.lk with island-wide delivery and cash on delivery.",
  alternates: { canonical: PATH },
  openGraph: og(PATH),
};

export default async function RasakathaBooksPage() {
  const all = await getAllOwnTitles();
  const first = paginate(all, 1, 24);
  return (
    <CatalogListing
      title="Rasakatha Publishers — Our Books"
      // CONFIRM: wording about the publisher.
      intro="Books published by Rasakatha Publishers, straight from the publisher. In-stock titles come first, newest at the top."
      query="own=1"
      initialItems={forCards(first.items)}
      initialGrid={<CatalogGrid items={forCards(first.items)} emptyMessage="No books here yet." />}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
    />
  );
}
