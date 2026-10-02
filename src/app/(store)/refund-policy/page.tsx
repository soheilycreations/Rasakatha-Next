import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/store/InfoPage";
import { SITE, og } from "@/lib/site";

// CONFIRM: this is a plain-language draft. Have it reviewed before launch and fill in the marked items.
export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Returns, exchanges and refunds at Rasakatha.lk.",
  alternates: { canonical: "/refund-policy" },
  openGraph: og("/refund-policy"),
};

export default function Page() {
  return (
    <InfoPage eyebrow="Legal" title="Refund Policy" intro="What to do if something is wrong with your order.">
      <InfoSection title="Damaged or wrong books">
        <p>If a book arrives damaged or you received a different title, contact us within {/* CONFIRM: number of days */}7 days of delivery with your order number and a photo. We will replace the book or refund you.</p>
      </InfoSection>
      <InfoSection title="Change of mind">
        <p>{/* CONFIRM: do you accept returns for change of mind? Conditions and who pays the return courier. */}Unread books in original condition may be returned within the period above.</p>
      </InfoSection>
      <InfoSection title="How refunds are paid">
        <p>Online payments are refunded to the original card or account through PayHere. {/* CONFIRM: refund timeframe and COD refund method (bank transfer?). */}</p>
      </InfoSection>
      <InfoSection title="Contact">
        <p>Contact us at {SITE.email} or {SITE.phone}.</p>
      </InfoSection>
    </InfoPage>
  );
}
