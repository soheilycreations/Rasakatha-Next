// Store-wide constants used by SEO metadata, structured data and the info
// pages. Contact details marked CONFIRM came from the store's hero banner —
// double-check them before going live.

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  // Set automatically by Vercel to the production domain of the project.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "https://rasakatha.lk";
}

export const SITE = {
  name: "Rasakatha.lk",
  legalName: "Rasakatha Publishers",
  url: resolveSiteUrl(),
  tagline: "Sri Lanka's home for Sinhala and English books",
  description:
    "Buy Sinhala and English books online from Rasakatha Publishers — novels, translations, poetry, children's books and more, with island-wide delivery and cash on delivery across Sri Lanka.",
  // CONFIRM: phone, WhatsApp, address and email.
  phone: "0777 728 727",
  phoneIntl: "+94777728727",
  whatsapp: "94777728727",
  email: "info@rasakatha.lk",
  address: "67, Ananda Mawatha, Maradana, Colombo 10, Sri Lanka",
  social: {
    // CONFIRM: replace with the store's real pages (leave "" to hide an icon).
    facebook: "https://www.facebook.com/rasakatha",
    instagram: "",
    youtube: "",
  },
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export const DEFAULT_OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "Rasakatha.lk — Sinhala & English books" };

// Page-level openGraph replaces the root one entirely, so always carry the image.
export function og(url: string, extra: { title?: string; description?: string } = {}) {
  return { type: "website" as const, siteName: SITE.name, locale: "en_LK", url, images: [DEFAULT_OG_IMAGE], ...extra };
}
