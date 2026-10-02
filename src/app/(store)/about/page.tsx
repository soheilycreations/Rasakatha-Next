import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoSection } from "@/components/store/InfoPage";
import { ROUTES } from "@/lib/links";
import { SITE, og } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Rasakatha Publishers",
  description: "Rasakatha Publishers — a Sri Lankan publisher and bookstore bringing Sinhala classics, translations and new voices to readers island-wide.",
  alternates: { canonical: "/about" },
  openGraph: og("/about"),
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Our Story"
      title="Sri Lanka's home for stories worth telling"
      intro="From timeless Sinhala classics to bold new voices, Rasakatha Publishers curates every title with care — bringing great reading to doorsteps across the island."
    >
      <InfoSection title="What we do">
        <p>
          We publish and sell Sinhala and English books — novels, translations of world literature, poetry,
          short stories, children&apos;s books and more. Every book on {SITE.name} ships from us directly.
        </p>
      </InfoSection>
      <InfoSection title="Shop with confidence">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Island-wide delivery, with the delivery fee shown before you place your order.</li>
          <li>Cash on Delivery and online payment options.</li>
          <li>
            Track any order with your order number and phone number on the{" "}
            <Link href={ROUTES.track} className="font-semibold text-accent-blue">order tracking page</Link>.
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Get in touch">
        <p>
          Questions about a book or an order? <Link href={ROUTES.contact} className="font-semibold text-accent-blue">Contact us</Link> —
          we&apos;re happy to help.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
