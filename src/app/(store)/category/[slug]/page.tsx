import type { Metadata } from "next";
import { og } from "@/lib/site";
import { notFound } from "next/navigation";
import CatalogListing from "@/components/store/CatalogListing";
import { forCards, getByCategory, getCategories, getCategoryBySlug, paginate } from "@/lib/catalog";
import { categoryHref } from "@/lib/links";

export const revalidate = 300;

// Render each page on its first visit, then serve it from cache (ISR).
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = await getCategoryBySlug((await params).slug);
  if (!name) return { title: "Category not found", robots: { index: false } };
  const title = `${name} Books`;
  const description = `Shop ${name.toLowerCase()} books online at Rasakatha.lk — Sinhala and English titles with island-wide delivery and cash on delivery in Sri Lanka.`;
  return {
    title,
    description,
    alternates: { canonical: categoryHref(name) },
    openGraph: og(categoryHref(name), { title, description }),
  };
}

export default async function CategoryPage({ params }: Props) {
  const name = await getCategoryBySlug((await params).slug);
  if (!name) notFound();
  const [items, categories] = await Promise.all([getByCategory(name), getCategories()]);
  const first = paginate(items, 1, 24);

  return (
    <CatalogListing
      key={name}
      title={`${name} Books`}
      query={`category=${encodeURIComponent(name)}`}
      initialItems={forCards(first.items)}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
      chips={categories.map((c) => ({ name: c.name, count: c.count }))}
      activeChip={name}
    />
  );
}
