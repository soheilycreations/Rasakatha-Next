import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/server/supabase";
import { ROUTES } from "@/lib/links";
import { money } from "@/lib/format";
import TrackPurchase from "@/components/store/TrackPurchase";

export const metadata: Metadata = { title: "Payment received", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Line = { id: string; title: string; price: number | null; qty: number };

export default async function Page({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  const { data: order } = order_id
    ? await supabase()
        .from("orders")
        .select("id,total,delivery_fee,items,payment_status")
        .eq("id", order_id)
        .maybeSingle()
    : { data: null };
  const paid = order?.payment_status === "paid";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-8">
      {order && paid ? (
        <>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Payment received — thank you!</h1>
          <p className="mt-2 text-[14px] text-[var(--ink-dim)]">
            Order <b>#{order.id}</b> ({money(Number(order.total))}) is confirmed and will be packed shortly.
          </p>
          <TrackPurchase
            orderId={order.id}
            total={Number(order.total)}
            shipping={Number(order.delivery_fee)}
            items={(order.items as Line[]).map((x) => ({ id: x.id, title: x.title, price: x.price ?? 0, qty: x.qty }))}
          />
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">We&apos;re confirming your payment</h1>
          <p className="mt-2 text-[14px] text-[var(--ink-dim)]">
            {order ? (
              <>
                Order <b>#{order.id}</b> is saved.{" "}
              </>
            ) : null}
            PayHere usually confirms within a minute. Refresh this page, or track your order with your order number
            and phone number.
          </p>
        </>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={ROUTES.track} className="btn-accent rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
          Track my order
        </Link>
        <Link
          href={ROUTES.home}
          className="rounded-full border border-[var(--border-strong)] px-6 py-3 text-[13.5px] font-bold text-[var(--ink)] hover:border-accent hover:text-accent"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
