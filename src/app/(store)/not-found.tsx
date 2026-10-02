import Link from "next/link";
import { ROUTES } from "@/lib/links";

export default function StoreNotFound() {
  return (
    <div className="px-4 py-20 text-center sm:px-8">
      <div className="font-display text-6xl font-black text-accent">404</div>
      <h1 className="font-display mt-3 text-2xl font-bold text-[var(--ink)]">We couldn&apos;t find that page</h1>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--ink-dim)]">
        The book or page may have moved. Try searching above, or browse our collection.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={ROUTES.home} className="btn-accent rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
          Go to homepage
        </Link>
        <Link
          href={ROUTES.categories}
          className="rounded-full border border-[var(--border-strong)] px-6 py-3 text-[13.5px] font-bold text-[var(--ink)] hover:border-accent hover:text-accent"
        >
          Browse all books
        </Link>
      </div>
    </div>
  );
}
