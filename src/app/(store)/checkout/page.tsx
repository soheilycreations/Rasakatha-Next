import type { Metadata } from "next";
import { CheckoutClient } from "@/components/store/ClientPages";

export const metadata: Metadata = {
  title: "Checkout",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CheckoutClient />;
}
