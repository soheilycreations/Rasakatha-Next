import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/store/InfoPage";
import { SITE, og } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Contact Rasakatha Publishers — call or WhatsApp ${SITE.phone}, email ${SITE.email}.`,
  alternates: { canonical: "/contact" },
  openGraph: og("/contact"),
};

const card =
  "flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] p-4 transition-colors hover:border-accent/40";

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Contact" title="We'd love to hear from you" intro="Questions about a book, an order or a bulk purchase? Reach us any way you like.">
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer" className={card}>
          <span className="text-[12px] font-bold uppercase tracking-wide text-accent">WhatsApp</span>
          <span className="text-[15px] font-semibold text-[var(--ink)]">{SITE.phone}</span>
          <span className="text-[12.5px]">Fastest way to reach us</span>
        </a>
        <a href={`tel:${SITE.phoneIntl}`} className={card}>
          <span className="text-[12px] font-bold uppercase tracking-wide text-accent">Call</span>
          <span className="text-[15px] font-semibold text-[var(--ink)]">{SITE.phone}</span>
        </a>
        <a href={`mailto:${SITE.email}`} className={card}>
          <span className="text-[12px] font-bold uppercase tracking-wide text-accent">Email</span>
          <span className="text-[15px] font-semibold text-[var(--ink)]">{SITE.email}</span>
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={card}
        >
          <span className="text-[12px] font-bold uppercase tracking-wide text-accent">Visit</span>
          <span className="text-[15px] font-semibold text-[var(--ink)]">{SITE.address}</span>
        </a>
      </div>
      <InfoSection title="About your order">
        <p>Please have your order number ready — it&apos;s on your order confirmation screen.</p>
      </InfoSection>
    </InfoPage>
  );
}
