import type { Metadata } from "next";
import { AccountClient } from "@/components/store/ClientPages";

export const metadata: Metadata = {
  title: "My Account",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <AccountClient />;
}
