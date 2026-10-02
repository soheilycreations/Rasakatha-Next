import type { MetadataRoute } from "next";
import { getCatalog, getCategories } from "@/lib/catalog";
import { authorHref, bookHref, categoryHref, ROUTES } from "@/lib/links";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, categories] = await Promise.all([getCatalog(), getCategories()]);
  const now = new Date();

  const staticPages = [
    { path: ROUTES.home, priority: 1, changeFrequency: "daily" as const },
    { path: ROUTES.categories, priority: 0.8, changeFrequency: "daily" as const },
    { path: ROUTES.newArrivals, priority: 0.8, changeFrequency: "daily" as const },
    { path: ROUTES.sale, priority: 0.8, changeFrequency: "daily" as const },
    { path: ROUTES.about, priority: 0.4, changeFrequency: "monthly" as const },
    { path: ROUTES.contact, priority: 0.4, changeFrequency: "monthly" as const },
    { path: ROUTES.delivery, priority: 0.4, changeFrequency: "monthly" as const },
    { path: ROUTES.help, priority: 0.4, changeFrequency: "monthly" as const },
    { path: ROUTES.track, priority: 0.3, changeFrequency: "yearly" as const },
  ];

  const authors = [...new Set(books.map((b) => b.author).filter(Boolean))];

  return [
    ...staticPages.map((p) => ({
      url: absoluteUrl(p.path),
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...categories.map((c) => ({
      url: absoluteUrl(categoryHref(c.name)),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...books.map((b) => ({
      url: absoluteUrl(bookHref(b)),
      changeFrequency: "weekly" as const,
      priority: b.inStock ? 0.6 : 0.3,
      ...(b.cover ? { images: [b.cover] } : {}),
    })),
    ...authors.map((name) => ({
      url: absoluteUrl(authorHref(name)),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ];
}
