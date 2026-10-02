import type { Metadata } from "next";
import { CartClient } from "@/components/store/ClientPages";

export const metadata: Metadata = {
  title: "Your Cart",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <CartClient />;
}
