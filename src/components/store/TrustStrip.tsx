import Link from "next/link";
import { ROUTES } from "@/lib/links";
import { SITE } from "@/lib/site";
import { IconTruck, IconBook, IconCart, IconHeart } from "./icons";

// Short reassurance row under the hero — the things Sri Lankan online
// shoppers check before trusting a new store.
const ITEMS = [
  { Icon: IconTruck, title: "Island-wide delivery", text: "Delivered to your doorstep", href: ROUTES.delivery },
  { Icon: IconCart, title: "Cash on Delivery", text: "Pay when your books arrive", href: ROUTES.delivery },
  { Icon: IconBook, title: "Straight from the publisher", text: "Genuine Rasakatha editions", href: ROUTES.rasakatha },
  { Icon: IconHeart, title: "Help on WhatsApp", text: SITE.phone, href: `https://wa.me/${SITE.whatsapp}` },
];

export default function TrustStrip() {
  return (
    <section aria-label="Why shop with us" className="mb-10 px-4 sm:px-8">
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {ITEMS.map(({ Icon, title, text, href }) => {
          const external = href.startsWith("http");
          const inner = (
            <>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/[0.12] text-accent">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-bold text-[var(--ink)] sm:text-[13px]">{title}</span>
                <span className="block truncate text-[11.5px] text-[var(--ink-faint)]">{text}</span>
              </span>
            </>
          );
          const cls =
            "flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] p-3 transition-colors hover:border-[var(--border-strong)]";
          return (
            <li key={title}>
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {inner}
                </a>
              ) : (
                <Link href={href} className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
