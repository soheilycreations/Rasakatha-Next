import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/links";

export const metadata: Metadata = { title: "Payment cancelled", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-8">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Payment cancelled</h1>
      <p className="mt-2 text-[14px] text-[var(--ink-dim)]">
        You weren&apos;t charged. Your order is saved as unpaid — you can pay for it later from Track Order, or place a
        new order with Cash on Delivery.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={ROUTES.track} className="btn-accent rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
          Track my order
        </Link>
        <Link
          href={ROUTES.checkout}
          className="rounded-full border border-[var(--border-strong)] px-6 py-3 text-[13.5px] font-bold text-[var(--ink)] hover:border-accent hover:text-accent"
        >
          Back to checkout
        </Link>
      </div>
    </div>
  );
}
