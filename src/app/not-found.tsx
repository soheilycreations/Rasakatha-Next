import type { Metadata } from "next";
import StoreNotFound from "./(store)/not-found";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <StoreNotFound />;
}
