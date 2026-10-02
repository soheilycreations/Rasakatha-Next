import Image from "next/image";
import Link from "next/link";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";
import { ROUTES } from "@/lib/links";
import { SITE } from "@/lib/site";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: ROUTES.newArrivals },
      { label: "All Categories", href: ROUTES.categories },
      { label: "Sale & Offers", href: ROUTES.sale },
    ],
  },
  {
    title: "Rasakatha",
    links: [
      { label: "About Us", href: ROUTES.about },
      { label: "Contact", href: ROUTES.contact },
      { label: "My Library", href: ROUTES.library },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Delivery & Returns", href: ROUTES.delivery },
      { label: "Order Tracking", href: ROUTES.track },
      { label: "Help Center", href: ROUTES.help },
      { label: "Privacy Policy", href: ROUTES.privacy },
      { label: "Terms & Conditions", href: ROUTES.terms },
      { label: "Refund Policy", href: ROUTES.refund },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", short: "f", href: SITE.social.facebook },
  { label: "Instagram", short: "ig", href: SITE.social.instagram },
  { label: "YouTube", short: "yt", href: SITE.social.youtube },
  { label: "WhatsApp", short: "wa", href: `https://wa.me/${SITE.whatsapp}` },
].filter((s) => s.href);

export default function Footer() {
  return (
    <footer className="mt-4 border-t border-[var(--border)] bg-[var(--card-2)] px-4 py-12 sm:px-8">
      <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-8">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center" aria-label="Rasakatha.lk home">
            <Image src={logoLight} alt="Rasakatha.lk" className="logo-light h-[38px] w-auto" />
            <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-[38px] w-auto" />
          </Link>
          <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-dim)]">
            Sri Lanka&apos;s home for Sinhala and English books — new releases, timeless classics,
            and everything in between, delivered island-wide.
          </p>
          <div className="mt-4 space-y-1 text-[13.5px] text-[var(--ink-dim)]">
            <a href={`tel:${SITE.phoneIntl}`} className="block hover:text-accent">
              {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="block hover:text-accent">
              {SITE.email}
            </a>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-14">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[12.5px] font-bold uppercase tracking-wide text-[var(--ink)]">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-[14px] text-[var(--ink-dim)]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-6 text-[13px] text-[var(--ink-faint)] sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <span>© {new Date().getFullYear()} {SITE.legalName}. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-2 text-[11.5px]">
            We accept:
            {["Cash on Delivery", "Visa", "Mastercard", "PayHere", "Koko", "MintPay"].map((m) => (
              <span
                key={m}
                className="rounded-md border border-[var(--border)] bg-[var(--surface-tint)] px-2 py-0.5 font-semibold text-[var(--ink-dim)]"
              >
                {m}
              </span>
            ))}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] text-[12px] font-bold text-[var(--ink-dim)] transition-colors hover:border-accent/40 hover:text-accent"
            >
              {s.short}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
