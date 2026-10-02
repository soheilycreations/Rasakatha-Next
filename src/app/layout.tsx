import type { Metadata, Viewport } from "next";
import { SITE } from "@/lib/site";
import Analytics from "@/components/Analytics";
import StoreShell from "@/components/store/StoreShell";
import { Manrope, Playfair_Display, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Rasakatha.lk | Buy Sinhala & English Books Online in Sri Lanka",
    template: "%s | Rasakatha.lk",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "Sinhala books",
    "buy books online Sri Lanka",
    "Sinhala novels",
    "Rasakatha Publishers",
    "Sinhala translations",
    "online bookstore Sri Lanka",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_LK",
    title: "Rasakatha.lk | Buy Sinhala & English Books Online in Sri Lanka",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  // Google Search Console HTML-tag verification (NEXT_PUBLIC_GSC_VERIFICATION).
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#12141a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "BookStore"],
      "@id": `${SITE.url}/#org`,
      name: SITE.legalName,
      alternateName: SITE.name,
      url: SITE.url,
      logo: `${SITE.url}/icon.png`,
      telephone: SITE.phoneIntl,
      email: SITE.email,
      address: { "@type": "PostalAddress", streetAddress: SITE.address, addressCountry: "LK" },
      sameAs: Object.values(SITE.social).filter(Boolean),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      publisher: { "@id": `${SITE.url}/#org` },
      inLanguage: ["si", "en"],
    },
  ],
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("rasakatha:theme");
    var theme = saved === "light" || saved === "dark" ? saved : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfair.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="h-full">
        <Analytics />
        <div className="grain-overlay" aria-hidden="true" />
        {/* Storefront chrome (sidebar, search, cart) stays mounted across pages. */}
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
