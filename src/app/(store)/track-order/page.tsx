import type { Metadata } from "next";
import { TrackClient } from "@/components/store/ClientPages";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your Rasakatha.lk order with your order number and phone number.",
  alternates: { canonical: "/track-order" },
};

export default function Page() {
  return <TrackClient />;
}
