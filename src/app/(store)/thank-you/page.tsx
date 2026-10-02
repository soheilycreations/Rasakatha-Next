import type { Metadata } from "next";
import { ThankYouClient } from "@/components/store/ClientPages";

export const metadata: Metadata = {
  title: "Order Placed",
  alternates: { canonical: "/thank-you" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ThankYouClient />;
}
