import type { MetadataRoute } from "next";
import { absoluteUrl, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/cart", "/checkout", "/thank-you", "/account", "/search", "/payment/", "/reset-password", "/auth/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}
