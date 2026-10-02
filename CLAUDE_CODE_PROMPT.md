# Rasakatha.lk — finish the store before connecting the rasakatha.lk domain

You are working on the Rasakatha Publishers online bookstore (this repo). Goal: make it the best premium online bookstore in Sri Lanka, then point the rasakatha.lk domain (currently the old WooCommerce site) at this Vercel project.

## Stack and rules
- Next.js 16 App Router + React 19 + Tailwind v4 + Supabase (service-role key, server-side only) + Vercel.
- This Next.js version has breaking changes. Read `AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before writing code. Do not use the Cache Components model (`cacheComponents` is off); caching uses `export const revalidate` and `revalidatePath`.
- Keep the existing dark/red design language (CSS variables in `src/app/globals.css`, `btn-accent`, Playfair display font).
- Never trust prices, totals or stock coming from the browser.
- Don't invent business facts (policies, delivery times, phone numbers). Where something is unknown, leave a `// CONFIRM:` comment and list it for me at the end.
- After each section: run `npx tsc --noEmit`, `npm run lint` and `npm run build`, then fix every error before moving on.
- Work in small commits, one per section.

## Already done (don't redo or revert)
- Real routes with server rendering and ISR: `/`, `/book/[id]-[slug]`, `/category/[slug]`, `/categories`, `/author/[name]`, `/sale`, `/new-arrivals`, `/about`, `/contact`, `/delivery-returns`, `/help`, `/track-order`, `/cart`, `/checkout`, `/thank-you`, `/account`, `/library`.
- `StoreShell` (`src/components/store/StoreShell.tsx`) is mounted from the root layout. It skips `/admin`. Shared state comes through `StoreContext` (`useStore`, `useCardHandlers`).
- SEO: metadata, canonical URLs, Open Graph (`og()` helper in `src/lib/site.ts`, `public/og.png`), Book/Product + Breadcrumb JSON-LD, `sitemap.ts`, `robots.ts`.
- `/api/orders` rebuilds the order server-side from the catalog. `/api/orders/[id]` is admin-only. Trending no longer exposes sales quantities.
- Fake ratings removed. Reviews are stored in a Supabase `reviews` table (`supabase/reviews.sql`) through `/api/reviews`, and only signed-in customers can post.
- CDN cache headers on public APIs. `invalidateCatalog()` also calls `revalidatePath("/", "layout")`.
- `src/components/store/StoreApp.tsx`, `CategoriesView.tsx` and `AuthorView.tsx` are empty leftovers. Delete them.

## 0. Check the baseline
- `npm install`, `npm run build`, then `npm run start`. Use the real Supabase from `.env.local` and click through home → category → book → add to cart → checkout (don't submit a real order unless I say so) → track order → admin.
- Confirm that `supabase/reviews.sql` has been run (the `reviews` table exists). If it hasn't, tell me.
- Check that book covers in the database are Supabase Storage URLs. If they are, `public/covers/` (~590 MB) isn't needed for deployment. Confirm, then ask me before deleting it or adding it to `.vercelignore`.

## 1. Domain migration and SEO (most important before go-live)
1. The old WooCommerce site has URLs indexed by Google, such as `/product/<slug>/`, `/product-category/<slug>/`, `/shop/`, `/my-account/`, `/cart/` and `/checkout/`. Look at the `old site/` folder and any WooCommerce export in the repo (e.g. `Last_100_Orders.xlsx`, product CSV/XML/SQL dumps) to recover the old product slugs and their WooCommerce IDs. Our book `id` is the WooCommerce product ID.
2. Store the old slug for each book (new nullable column `books.legacy_slug` plus a migration SQL file), and add permanent (308) redirects:
   - `/product/<slug>/` → `/book/<id>-<slug>`
   - `/product-category/<cat>/` → `/category/<slug>`
   - `/shop` → `/categories`
   - `/my-account` → `/account`
   - Also redirect `?p=<id>` and `/?post_type=product&p=<id>` to the book page.
   - Use `src/proxy.ts`/`middleware` or a route handler. Don't put 1,500 static redirects in `next.config`.
3. `NEXT_PUBLIC_SITE_URL` must be `https://rasakatha.lk` in Vercel Production. Add `www` → apex redirect notes to the README.
4. While still on `*.vercel.app` (before the domain is connected), add `noindex` to all pages so Google doesn't index the preview domain. It should switch off automatically when the host is `rasakatha.lk`.
5. Add a Google Search Console verification meta tag through an env variable. Add GA4 and Meta Pixel with env-driven IDs, loaded with `next/script` and only when the ID is set. Track `view_item`, `add_to_cart`, `begin_checkout` and `purchase` events.
6. Add `src/app/error.tsx` and `src/app/global-error.tsx` with the store design, plus `loading.tsx` skeletons for book and category routes.

## 2. Payments (blocking for launch)
- Checkout offers PayHere, Koko and MintPay, but none are integrated. The order is only saved with the method name.
- Implement PayHere properly:
  - Merchant ID and secret come from env.
  - After the order is saved, redirect to the PayHere checkout with the correct MD5 hash.
  - Add a `notify_url` webhook at `/api/payments/payhere/notify` that verifies `md5sig` and updates the order to `paid` (new `payment_status` column: `pending | paid | failed | cod`), plus return/cancel pages.
  - Use sandbox mode when `PAYHERE_SANDBOX=true`.
- Koko and MintPay: hide them behind env feature flags (`ENABLE_KOKO`, `ENABLE_MINTPAY`) and keep them off until we have merchant accounts. Leave a clear TODO.
- Replace the "COD / PH / KO / MP" text badges with proper inline SVG logos or neutral icons.
- Only COD and integrated gateways may be selectable. `/api/orders` must reject disabled methods.

## 3. Order notifications and operations
- When an order is placed, send a confirmation email to the customer and a notification to the store. Use Resend or SMTP via env. Use a WhatsApp Cloud API/notify.lk SMS hook if env keys are present, otherwise skip silently. The thank-you page already says "We'll send updates to your phone", so this has to actually happen when the admin changes the status.
- Order IDs are random 5-digit numbers. Switch to a non-guessable but readable format (e.g. `RK-24XXXX`) for new orders, keeping old IDs working.
- Optional stock tracking: add a `stock_qty` column. Decrement it when an order is placed. Set `in_stock` to false at 0. Let admin edit it.

## 4. Security hardening
- `src/lib/server/adminAuth.ts` falls back to the password `rasakatha2026` and a static secret, and the session token never expires. In production:
  - Require `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`, and refuse to log in if they're missing.
  - Use a signed, expiring session (e.g. HMAC of expiry + nonce, 7 days).
  - Compare passwords in constant time.
- Add simple rate limiting (per IP, using Supabase or Upstash via env) to: admin login, customer login/register, `/api/orders` POST, `/api/reviews` POST and `/api/orders/lookup`.
- Add security headers in `next.config.ts`: CSP that allows Supabase, PayHere, Google and Meta; HSTS; `X-Frame-Options`; `Referrer-Policy`.
- `src/app/api/admin/authors/route.ts` still uses `displayRating()` (fake ratings). Switch it to real ratings, then delete `displayRating` from `src/lib/format.ts`.

## 5. Customer accounts and UX
- `AuthModal`:
  - Close it with Escape and a visible ✕ button.
  - Trap focus inside it.
  - Add "Forgot password?" (Supabase `resetPasswordForEmail` plus a `/reset-password` page).
  - Show/hide password.
  - Add Google sign-in via Supabase OAuth if the env is configured.
- Checkout:
  - Replace the 130-option `<select>` with a searchable district → town combobox (keyboard accessible). The shipping zone logic in `src/lib/shipping.ts` must not change.
  - Remember the customer's last address in `localStorage`, and prefill it for signed-in users.
- Sync the wishlist ("My Library") to the account when signed in, merging with local data.
- Search:
  - Add a real `/search?q=` page (server-rendered, `noindex`).
  - Add an instant-suggestions dropdown under the search box (books + authors, keyboard navigation).
  - Make search tolerant of Singlish ↔ Sinhala titles: titles are "සිංහල | English", so match both halves and ignore punctuation.
- Mobile:
  - Show the logo in the mobile top bar.
  - Keep the bottom nav from hiding page content.
  - Add a sticky "Add to Cart" bar on mobile book pages.
- Accessibility:
  - Visible focus rings everywhere.
  - Every icon button needs an `aria-label`.
  - Colour contrast must be at least 4.5:1 in both themes.
  - Run axe (Playwright + @axe-core) on the main pages and fix the issues.
- Check light mode on every page.

## 6. Book data quality
- Add nullable columns `isbn`, `pages`, `language` (si/en/ta), `published_year`, `binding`, `translator` to `books`, with a migration SQL file.
- Add these fields to the admin book form.
- Show them in the details table on the book page and in the JSON-LD (`isbn`, `numberOfPages`, `inLanguage`, `bookFormat`, `translator`).
- Admin: add a reviews moderation page (list, hide/approve, delete) at `/admin/reviews`, protected by middleware. Keep `books.rating` in sync.

## 7. Performance and images
- `BookCover` sets `unoptimized` for remote covers because some covers are 5–8 MB scans.
- Write a one-off script (`scripts/optimize-covers.ts`) that downloads every cover from Supabase Storage, makes a max-900 px WebP (quality ~80), uploads it next to the original and updates `books.cover`.
- Make the admin upload route do the same for new uploads.
- Then remove `unoptimized` so `next/image` serves responsive sizes.
- Hero slides: use responsive `sizes`, and give only the first slide `priority`.
- Run Lighthouse (mobile) on `/`, a book page and a category page. Target Performance 90+, SEO 100, Accessibility 95+, Best Practices 100. Report the before/after scores.

## 8. Legal and trust pages
- Add `/privacy-policy`, `/terms` and `/refund-policy` pages (PayHere requires them for merchant approval). Base them on the existing `InfoPage` component, mark business-specific statements with `CONFIRM`, link them in the footer, and add them to the sitemap.

## 9. Tests
- Add Playwright e2e tests (`tests/e2e`) covering:
  - Home renders books.
  - The book page has a title, price and JSON-LD.
  - Add to cart → checkout validation errors.
  - A tampered order price is rejected or recalculated.
  - `/api/orders/<id>` returns 401 without admin.
  - Old WooCommerce URLs redirect.
  - The sitemap contains book URLs.
- Add an `npm run test:e2e` script.

## Finish
When done, give me:
1. A short changelog.
2. The env variables I must add in Vercel.
3. The SQL migrations I must run in Supabase, in order.
4. Every `CONFIRM:` item that needs my input.
5. A go-live checklist for switching the rasakatha.lk DNS from WooCommerce to Vercel: lower DNS TTL first, add the domain in Vercel, check SSL, submit the sitemap in Search Console, monitor 404s for a week.
