"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 py-20 text-center sm:px-8">
      <div className="font-display text-6xl font-black text-accent">Oops</div>
      <h1 className="font-display mt-3 text-2xl font-bold text-[var(--ink)]">Something went wrong</h1>
      <p className="mx-auto mt-2 max-w-md text-[14px] text-[var(--ink-dim)]">
        We hit a snag loading this page. Please try again — your cart is safe.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-accent rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-[var(--border-strong)] px-6 py-3 text-[13.5px] font-bold text-[var(--ink)] hover:border-accent hover:text-accent"
        >
          Go to homepage
        </Link>
      </div>
    </div>
  );
}
