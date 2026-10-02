import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoSection } from "@/components/store/InfoPage";
import { ROUTES } from "@/lib/links";
import { SITE, og } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery & Returns",
  description: "Island-wide delivery charges, cash on delivery and returns at Rasakatha.lk.",
  alternates: { canonical: "/delivery-returns" },
  openGraph: og("/delivery-returns"),
};

export default function DeliveryPage() {
  return (
    <InfoPage eyebrow="Support" title="Delivery & Returns" intro="We deliver to every district in Sri Lanka.">
      <InfoSection title="Delivery charges">
        <p>
          The delivery fee depends on your town and the total weight of your books: from Rs. 350 to Rs. 500
          for the first kilogram, plus about Rs. 100 for each extra kilogram. The exact fee is calculated
          and shown at checkout before you place your order.
        </p>
      </InfoSection>
      <InfoSection title="Payment">
        <p>
          Pay with Cash on Delivery, or choose an online option (card / internet banking via PayHere, or
          instalments with Koko or MintPay) at checkout.
        </p>
      </InfoSection>
      <InfoSection title="Tracking your order">
        <p>
          Use your order number and phone number on the{" "}
          <Link href={ROUTES.track} className="font-semibold text-accent-blue">order tracking page</Link> to see
          whether your order has been packed, shipped or delivered.
        </p>
      </InfoSection>
      {/* CONFIRM: replace with the store's actual returns policy wording. */}
      <InfoSection title="Damaged or incorrect books">
        <p>
          If a book arrives damaged or you received the wrong title, contact us on WhatsApp at{" "}
          <a href={`https://wa.me/${SITE.whatsapp}`} className="font-semibold text-accent-blue">{SITE.phone}</a>{" "}
          with your order number and a photo, and we&apos;ll sort it out.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
