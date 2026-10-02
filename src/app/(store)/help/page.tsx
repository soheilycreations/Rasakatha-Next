import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/store/InfoPage";
import { ROUTES } from "@/lib/links";
import { SITE, og } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help Center — FAQ",
  description: "Answers to common questions about ordering, delivery, payment and accounts at Rasakatha.lk.",
  alternates: { canonical: "/help" },
  openGraph: og("/help"),
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I place an order?",
    a: <>Add books to your cart, open the cart and choose <b>Checkout</b>. Enter your details, pick a payment method and place the order — you don&apos;t need an account.</>,
  },
  {
    q: "How much is delivery?",
    a: <>It depends on your town and parcel weight, and is shown at checkout. See <Link href={ROUTES.delivery} className="font-semibold text-accent-blue">Delivery &amp; Returns</Link>.</>,
  },
  {
    q: "Can I pay cash on delivery?",
    a: <>Yes. Cash on Delivery is available island-wide, along with card, internet banking and instalment options.</>,
  },
  {
    q: "How do I track my order?",
    a: <>Go to <Link href={ROUTES.track} className="font-semibold text-accent-blue">Order Tracking</Link> and enter your order number and phone number.</>,
  },
  {
    q: "Can I send a book as a gift?",
    a: <>Yes — tick <b>Send this as a gift</b> at checkout and enter the recipient&apos;s name, phone number and address.</>,
  },
  {
    q: "Something is wrong with my order",
    a: <>Message us on <a href={`https://wa.me/${SITE.whatsapp}`} className="font-semibold text-accent-blue">WhatsApp ({SITE.phone})</a> with your order number and we&apos;ll help.</>,
  },
];

export default function HelpPage() {
  return (
    <InfoPage eyebrow="Help Center" title="Frequently asked questions">
      <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)]">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-4 py-3.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14.5px] font-semibold text-[var(--ink)]">
              {f.q}
              <span className="text-accent transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="mt-2 text-[14px]">{f.a}</div>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}
