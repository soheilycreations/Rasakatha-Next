import type { Metadata } from "next";
import { og } from "@/lib/site";
import { notFound } from "next/navigation";
import CatalogListing from "@/components/store/CatalogListing";
import CatalogGrid from "@/components/store/CatalogGrid";
import AuthorAvatar from "@/components/store/AuthorAvatar";
import { forCards, getByAuthor, paginate } from "@/lib/catalog";
import { authorHref } from "@/lib/links";

export const revalidate = 600;

// Render each page on its first visit, then serve it from cache (ISR).
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent((await params).name);
  const books = await getByAuthor(name);
  if (books.length === 0) return { title: "Author not found", robots: { index: false } };
  const description = `${books.length} book${books.length === 1 ? "" : "s"} by ${name} available at Rasakatha.lk with island-wide delivery in Sri Lanka.`;
  return {
    title: `Books by ${name}`,
    description,
    alternates: { canonical: authorHref(name) },
    openGraph: og(authorHref(name), { title: `Books by ${name}`, description }),
  };
}

export default async function AuthorPage({ params }: Props) {
  const name = decodeURIComponent((await params).name);
  const books = await getByAuthor(name);
  if (books.length === 0) notFound();
  const first = paginate(books, 1, 24);

  return (
    <CatalogListing
      key={name}
      title={`Books by ${name}`}
      query={`author=${encodeURIComponent(name)}`}
      initialItems={forCards(first.items)}
      initialGrid={<CatalogGrid items={forCards(first.items)} emptyMessage="No books here yet." />}
      initialPageCount={first.pageCount}
      initialTotal={first.total}
      header={
        <div className="mb-6 flex items-center gap-4 rounded-[24px] border border-[var(--border)] bg-card px-5 py-6 sm:px-8">
          <AuthorAvatar name={name} size={72} className="text-xl" />
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">Author</div>
            <div className="font-display text-xl font-bold text-[var(--ink)] sm:text-2xl">{name}</div>
            <div className="mt-1 text-[13px] text-[var(--ink-dim)]">
              {books.length} book{books.length === 1 ? "" : "s"} · {books.filter((b) => b.inStock).length} in stock
            </div>
          </div>
        </div>
      }
    />
  );
}
