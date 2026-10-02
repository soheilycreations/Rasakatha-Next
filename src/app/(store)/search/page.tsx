import type { Metadata } from "next";
import CatalogListing from "@/components/store/CatalogListing";
import { forCards, paginate, searchCatalog } from "@/lib/catalog";

// Search results are never worth indexing (infinite query space, thin pages).
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  if (!q) {
    return (
      <div className="px-4 py-16 text-center sm:px-8">
        <h1 className="font-display text-xl font-bold text-[var(--ink)]">Search the store</h1>
        <p className="mt-2 text-[13.5px] text-[var(--ink-faint)]">Type a book title, author or publisher in the search box above.</p>
      </div>
    );
  }
  const first = paginate(await searchCatalog(q), 1, 24);
  return (
    <CatalogListing
      key={q}
      title={`Search results for “${q}”`}
      query={`search=${encodeURIComponent(q)}`}
      initialItems={forCards(first.items)}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
    />
  );
}
