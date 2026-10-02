import type { Metadata } from "next";
import InfoPage, { InfoSection } from "@/components/store/InfoPage";
import { SITE, og } from "@/lib/site";

// CONFIRM: this is a plain-language draft. Have it reviewed before launch and fill in the marked items.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Rasakatha.lk collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: og("/privacy-policy"),
};

export default function Page() {
  return (
    <InfoPage eyebrow="Legal" title="Privacy Policy" intro="How we handle your personal information.">
      <InfoSection title="Who we are">
        <p>{SITE.legalName} operates {SITE.name}, based at {SITE.address}. Contact us at {SITE.email} or {SITE.phone}.</p>
      </InfoSection>
      <InfoSection title="What we collect">
        <p>When you order or create an account we collect your name, phone number, email address and delivery address. We also record the books you order and the payment method you choose.</p>
        <p>We use cookies and similar storage to keep your cart and sign-in, and, if enabled, analytics tools (Google Analytics, Meta Pixel) to understand how the store is used.</p>
      </InfoSection>
      <InfoSection title="How we use it">
        <p>To process and deliver orders, send order updates by email or SMS, answer your questions and prevent fraud. We do not sell your personal information.</p>
      </InfoSection>
      <InfoSection title="Payments">
        <p>Online card payments are handled by PayHere. We never see or store your card details. {/* CONFIRM: add any other payment partners. */}</p>
      </InfoSection>
      <InfoSection title="Sharing">
        <p>We share your name, phone number and address with our courier so your order can be delivered, and with service providers (hosting, email, SMS) who process data on our behalf. {/* CONFIRM: name the courier partners. */}</p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>You can ask us to correct or delete your account data at any time by contacting us. {/* CONFIRM: data retention period for order records. */}</p>
      </InfoSection>
    </InfoPage>
  );
}
