import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : "*.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },

  // Keep Google from indexing the *.vercel.app preview/prod domain. The header is
  // host-conditional, so it disappears on its own once rasakatha.lk serves the site.
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\.vercel\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  // Old WooCommerce URLs. Product/category slugs are resolved by route handlers
  // under /legacy (data in src/lib/data/legacy-*.json); fixed pages redirect here.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/books/:slug", destination: "/legacy/book/:slug" },
        { source: "/product/:slug", destination: "/legacy/book/:slug" },
        { source: "/product-category/:path*/:slug", destination: "/legacy/category/:slug" },
        { source: "/product-category/:slug", destination: "/legacy/category/:slug" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    return [
      // /?p=<id> and /?post_type=product&p=<id> (WooCommerce shortlinks). "/" is
      // prerendered, so this has to be a config redirect rather than proxy logic.
      {
        source: "/",
        has: [{ type: "query", key: "p", value: "(?<id>\\d+)" }],
        destination: "/legacy/id/:id",
        permanent: true,
      },
      { source: "/shop", destination: "/categories", permanent: true },
      { source: "/my-account", destination: "/account", permanent: true },
      { source: "/my-account/:path*", destination: "/account", permanent: true },
      { source: "/product-tag/:path*", destination: "/categories", permanent: true },
      { source: "/all-authers-page", destination: "/categories", permanent: true },
      { source: "/wishlist", destination: "/library", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/payment-information", destination: "/delivery-returns", permanent: true },
      { source: "/terms-of-service", destination: "/terms", permanent: true },
      { source: "/privacy-policy-2", destination: "/privacy-policy", permanent: true },
      { source: "/home", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
