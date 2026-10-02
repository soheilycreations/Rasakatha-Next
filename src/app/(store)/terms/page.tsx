import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/store/InfoPage";
import { SITE, og } from "@/lib/site";

// CONFIRM: this is a plain-language draft. Have it reviewed before launch and fill in the marked items.
export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms for buying books from Rasakatha.lk.",
  alternates: { canonical: "/terms" },
  openGraph: og("/terms"),
};

export default function Page() {
  return (
    <InfoPage eyebrow="Legal" title="Terms & Conditions" intro="Please read these terms before placing an order.">
      <InfoSection title="Orders">
        <p>An order is confirmed once you receive an order number. We may cancel an order if a book is unavailable or an error in price or stock is found, and we will refund any payment made.</p>
      </InfoSection>
      <InfoSection title="Prices">
        <p>All prices are in Sri Lankan rupees (LKR). Delivery charges are calculated at checkout from your town and the weight of your books.</p>
      </InfoSection>
      <InfoSection title="Payment">
        <p>You can pay by Cash on Delivery or, where offered, online through PayHere. {/* CONFIRM: any limits on COD orders. */}</p>
      </InfoSection>
      <InfoSection title="Delivery">
        <p>We deliver island-wide. {/* CONFIRM: typical delivery times by area. */} Delivery times are estimates, not guarantees.</p>
      </InfoSection>
      <InfoSection title="Returns and refunds">
        <p>See our Refund Policy.</p>
      </InfoSection>
      <InfoSection title="Contact">
        <p>Contact us at {SITE.email} or {SITE.phone}.</p>
      </InfoSection>
    </InfoPage>
  );
}
