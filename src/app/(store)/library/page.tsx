import type { Metadata } from "next";
import { LibraryClient } from "@/components/store/ClientPages";

export const metadata: Metadata = {
  title: "My Library",
  description: "Books you have saved on Rasakatha.lk.",
  alternates: { canonical: "/library" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <LibraryClient />;
}
