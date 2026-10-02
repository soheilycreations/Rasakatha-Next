import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ProductView from "@/components/store/ProductView";
import { forCards, getBookById, getByAuthor, getByCategory } from "@/lib/catalog";
import { bookHref, bookIdFromParam, categoryHref } from "@/lib/links";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE } from "@/lib/site";

export const revalidate = 600;

// Render each page on its first visit, then serve it from cache (ISR).
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

async function load(params: Props["params"]) {
  const { slug } = await params;
  const book = await getBookById(bookIdFromParam(slug));
  return { slug, book };
}

function summary(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").replace(/^["“]|["”]$/g, "").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book } = await load(params);
  if (!book) return { title: "Book not found", robots: { index: false } };

  const price = book.onSale && book.salePrice ? book.salePrice : book.regularPrice;
  const description = book.blurb
    ? summary(book.blurb)
    : `Buy ${book.title} by ${book.author} online from ${SITE.name}. Rs. ${price.toLocaleString("en-US")} with island-wide delivery and cash on delivery in Sri Lanka.`;
  const url = bookHref(book);

  return {
    title: `${book.title} — ${book.author}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${book.title} — ${book.author}`,
      description,
      images: book.cover ? [{ url: book.cover, alt: book.title }] : [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: book.cover ? [book.cover] : undefined },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug, book } = await load(params);
  if (!book) notFound();

  // Old or partial links (e.g. /book/38449) settle on one canonical URL.
  const canonical = bookHref(book);
  if (`/book/${decodeURIComponent(slug)}` !== decodeURIComponent(canonical)) permanentRedirect(canonical);

  const [byAuthor, sameCategory] = await Promise.all([getByAuthor(book.author), getByCategory(book.category)]);
  const moreByAuthor = forCards(byAuthor.filter((b) => b.id !== book.id).slice(0, 16));
  const authorIds = new Set(moreByAuthor.map((b) => b.id));
  const related = forCards(
    sameCategory.filter((b) => b.inStock && b.id !== book.id && !authorIds.has(b.id)).slice(0, 16)
  );

  const price = book.onSale && book.salePrice ? book.salePrice : book.regularPrice;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Book", "Product"],
        "@id": absoluteUrl(canonical),
        name: book.title,
        url: absoluteUrl(canonical),
        image: book.cover || undefined,
        description: book.blurb ? summary(book.blurb, 500) : undefined,
        author: { "@type": "Person", name: book.author },
        ...(book.publisher ? { publisher: { "@type": "Organization", name: book.publisher } } : {}),
        genre: book.category,
        sku: book.id,
        brand: { "@type": "Brand", name: book.publisher || SITE.legalName },
        offers: {
          "@type": "Offer",
          url: absoluteUrl(canonical),
          priceCurrency: "LKR",
          price,
          availability: book.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": `${SITE.url}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: book.category, item: absoluteUrl(categoryHref(book.category)) },
          { "@type": "ListItem", position: 3, name: book.title, item: absoluteUrl(canonical) },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductView book={book} moreByAuthor={moreByAuthor} related={related} shareUrl={absoluteUrl(canonical)} />
    </>
  );
}
