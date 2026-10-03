# Rasakatha Admin — upgrade to a unified, premium Web + POS back office

Hand this file to Claude Code. Work phase by phase, in order. Each phase ends with `npx tsc --noEmit`, `npm run lint`, `npm run build`, the store and admin e2e tests, a commit, and a short report to me. Ask me before running any SQL against production, deleting data, or pushing.

Read `AGENTS.md` and `node_modules/next/dist/docs/` before writing Next.js code. Keep the existing dark/red admin design (AdminShell, Playfair headings, `btn-accent`).

---

## Review of the current admin (live, 3 Oct 2026)

Bugs and gaps found on the live site:

1. **The Dashboard ignores POS sales.** The Dashboard shows Rs. 9,500 from 3 orders (web only). Reports shows Rs. 37,730 (web Rs. 9,500 + shop Rs. 28,230). The owner's home screen therefore under-reports revenue by about 75%.
2. **Customers don't link across channels.** Shop sale `#P46824` was billed to "Ishara sampath", but Customers shows that customer with 0 shop sales. POS sales without a phone number never match, and there is no merge or dedupe.
3. **Inventory isn't real yet.**
   - "Stock qty" is blank for every book, so stock shows only In/Out.
   - There is no stock movement history.
   - Web orders and POS sales don't reserve or deduct stock in one shared place.
   - There is no cost price, so profit can't be calculated.
4. **POS speed and flow.**
   - Search shows "Searching…" for about 2 s per query.
   - Every add opens a "How many copies?" step.
   - There is no barcode/ISBN scan, receipt printing, shift open/close or returns.
5. **Web orders operations.**
   - Statuses are only Placed → Packed → Shipped → Delivered: there is no Cancelled, Returned or Refunded, and no payment status.
   - There is no courier tracking number, invoice or packing-slip print, bulk status update, internal notes or timeline.
   - Expanding a row reflows the whole table.
6. **Books admin.**
   - The cover thumbnails in the list are empty.
   - The edit form is placeholder-only: once filled, `1650 / 1485 / 448` have no visible labels.
   - There is no bulk edit, CSV import/export, archive (soft delete) or low-stock view.
7. **Authors.** Every card shows "★ 0.0" noise.
8. **Hero sliders.** Slides can point at ids that aren't books (e.g. "dunhida"), so the storefront hero can't sell them.
9. **Charts.** The 14-day revenue chart uses a smoothed spline that overshoots between points, which is misleading for sparse daily data. Use monotone or straight lines.
10. **One shared admin password, no roles, no audit trail.** The owner and the cashier have the same access, including delete.

---

## Phase 1 — One source of truth (data foundation)

Goal: every number in the admin comes from one unified sales and inventory model.

1. **Unified sales ledger.**
   - Create a SQL view `sales_ledger` that unions `orders` (channel `web`) and `pos_sales` (channel `pos`), with one row per line item. Columns: `sale_id, channel, created_at, book_id, qty, unit_price, line_total, discount, customer_key, payment_method, payment_status, status`.
   - Exclude cancelled/refunded sales from revenue.
   - Build the Dashboard, Reports and Customers on this ledger so every page reports the same figures.
2. **Inventory with movements.**
   - Add `stock_movements` (`id, book_id, delta, reason: sale_web | sale_pos | return | adjust | receive | reserve | release, ref_id, user, created_at`).
   - `books.stock_qty` is maintained transactionally by an RPC or Postgres function, so concurrent web and POS sales can't oversell.
   - Web orders reserve stock when placed, deduct it when shipped, and release it when cancelled.
   - POS deducts stock immediately.
   - `in_stock` is derived automatically from the quantity.
   - Provide a one-time "stock take" screen to enter current counts for all 1,489 books quickly: keyboard grid, filter by category, scan ISBN.
3. **Costs and suppliers.**
   - Add `cost_price`, `supplier`, `reorder_level` and `barcode` (default to the ISBN) to books.
   - Add a `suppliers` table and simple **Goods Received** entries (purchase in → stock movement `receive`, updating the cost).
4. **Customer identity.**
   - Use one `customers` table keyed by normalized phone (07XXXXXXXX → +947XXXXXXXX), with email as a secondary key.
   - Link web orders and POS sales to `customer_id`.
   - Add a merge tool for duplicates.
   - Backfill existing orders and sales, including name-only POS sales (fuzzy name match, then manual confirm).
5. **Order lifecycle.**
   - Statuses: `pending_payment, placed, confirmed, packed, shipped, delivered, cancelled, returned, refunded`.
   - Add `payment_status`, `courier`, `tracking_no`, `internal_notes`, and an `order_events` timeline table (who changed what, when).
6. **Bootstrap history.**
   - Import historical WooCommerce orders from `Last_100_Orders.xlsx` and anything in `old site/` (Woo DB or CSV) into the ledger as channel `web_legacy`.
   - Without history, Phase 4's forecasts would be guesses. Report how many orders, line items and customers were imported.

Write migrations as new files in `supabase/` with a README run order. Make the code tolerate missing columns until I run them.

## Phase 2 — Pro POS (counter-ready)

1. **Instant search.**
   - Load a compact in-memory index: id, title (both halves), author, ISBN/barcode, price, stock.
   - Search locally with diacritic/Singlish-tolerant matching. Results should appear in under 50 ms.
   - Show stock and price in the results.
2. **Scan-first flow.**
   - A USB barcode scanner types the ISBN and then Enter, which adds the book with qty 1 instantly. Scanning again increments the quantity.
   - Remove the mandatory "How many copies?" step: edit quantity inline in the bill (+/−, type a number).
   - Keyboard shortcuts: F2 search, F4 customer, F8 discount, F9 pay, F12 complete, Esc clear.
3. **Bill features.**
   - Line and bill discounts (percentage or amount) with a reason. A cashier's discount limit is set by role.
   - Split payment (cash + card).
   - Change calculation with quick cash buttons (Rs. 1,000 / 2,000 / 5,000).
   - Hold and recall bills synced to the server, not only `localStorage`.
4. **Receipts.**
   - 80 mm thermal receipt via a print stylesheet: store header, items, totals, payment, a QR code to the store, and a return note marked CONFIRM.
   - Reprint from Shop Sales.
   - Optional WhatsApp/SMS/email e-receipt to the customer's phone or email.
5. **Customer at the till.**
   - Look up the customer by phone, show lifetime spend and last purchase, and attach them to the sale.
   - Quick-add a new customer.
6. **Shifts and cash.**
   - Open a shift with an opening float.
   - Record cash in/out with reasons.
   - Close the shift with a counted-cash vs expected comparison, and produce a printable Z-report (sales by payment method, discounts, returns, over/short).
7. **Returns and exchanges.**
   - Start from a receipt number: select lines, then refund or exchange.
   - Stock is returned via `stock_movements`.
8. **Offline tolerance.**
   - If the network drops (common with power cuts), queue completed sales in IndexedDB.
   - Show an "Offline — N sales waiting" badge and sync with idempotency keys when back online.
9. **Layout.**
   - Two-column layout on screens of 1024 px and wider (bill on the left, checkout pinned on the right).
   - On tablets, use touch targets of at least 44 px.

## Phase 3 — Web order operations

1. An order detail page (`/admin/orders/[id]`) showing:
   - items with covers
   - subtotal, delivery and total
   - payment and PayHere status
   - customer card with history
   - delivery address with a copy button
   - timeline
   - internal notes
2. **Printing.** A4 invoice and packing slip, plus bulk print for selected orders.
3. **Bulk actions.** Mark selected orders packed or shipped, and set the courier and tracking number.
4. **Courier.**
   - Export selected orders in a CSV format the courier accepts. Make the courier configurable and mark the format CONFIRM.
   - Customer SMS/WhatsApp on shipped, with the tracking number.
5. **COD reconciliation.** A list of delivered COD orders with collected/not-collected status and the amount outstanding.
6. **Queue views.** Tabs for New (action needed), To pack, To ship, In transit, Problems (failed payment, long-unshipped). Show a badge count in the sidebar.
7. A table layout that doesn't reflow when a row expands; use a side drawer instead.

## Phase 4 — Insights and predictions (the "advanced" part)

Build an **Insights** section. Everything is computed server-side from `sales_ledger` + `stock_movements` and cached (revalidate 1 h).

Use transparent, explainable methods; no black boxes. Show "based on N days of data" and hide or label forecasts when there isn't enough history.

1. **Owner dashboard (replaces the current one).**
   - Today / yesterday / this week / this month for revenue, gross profit (once cost price exists), orders, units and AOV. Show a web vs shop split, with a delta vs the previous period.
   - Channel mix chart.
   - Top books and top categories.
   - Low-stock alerts.
   - Orders needing action.
   - Cash expected in the drawer.
2. **Demand forecast per book.**
   - Daily unit sales, combining web and POS.
   - Model: exponential smoothing with a day-of-week factor. Add Sri Lanka seasonal flags:
     - April Avurudu
     - the September Colombo International Book Fair
     - December holidays
     - school-term starts for children's and educational books
     - Valentine's and Women's Day for the gift collections
   - Output: forecast units for the next 7, 30 and 90 days, with a confidence band.
3. **Reorder assistant.**
   - Days of cover = stock ÷ forecast daily demand.
   - Suggested reorder quantity = forecast × (lead time + review period) + safety stock − (stock + on order).
   - Lead time is set per supplier.
   - One-click "Create purchase list" (printable, or exported per supplier).
4. **Stock health.**
   - ABC analysis (A = top 80% of revenue).
   - Dead stock: no sale in 90/180 days, with the value tied up.
   - Sell-through rate per title.
   - Pre-order demand tracking for titles like "Mai Wahi – Pre Order", for the print-run decision.
5. **Customers.**
   - RFM segments: Champions, Loyal, At risk, Lost, New.
   - Repeat-purchase rate and time to second purchase.
   - Customers at risk of churning.
   - An exportable list for WhatsApp/SMS campaigns. Include opt-out handling and never message customers who haven't consented.
6. **Recommendations.**
   - "Customers who bought this also bought" from co-purchase counts. Use it on the storefront book page (replacing or adding to the "More in category" row) and as POS upsell hints.
7. **Alerts.**
   - Daily 8 am summary to the owner (email/SMS): yesterday's sales, low stock, orders to ship, and anomalies (sales more than 2σ below normal, a book suddenly spiking).
8. **Exports.** CSV/Excel export on every report table.

## Phase 5 — Platform quality

1. **Users and roles.**
   - Replace the shared `ADMIN_PASSWORD` with Supabase Auth staff accounts: roles `owner`, `manager`, `cashier`.
   - Cashiers get POS and their own Shop Sales only, with no deletes, no cost prices and a discount limit.
   - Add 2FA (TOTP) for owner and manager.
   - Write an `audit_log` entry for every create, update or delete (who, what, before/after).
   - Keep the env-password login as an emergency "break glass" owner login, disabled by default.
2. **Safer data.**
   - Books are archived, not deleted (`archived_at`).
   - Add Undo toasts.
   - Confirmations name the item.
3. **Admin UX polish.**
   - Visible labels on every form field.
   - Working cover thumbnails in lists.
   - A Ctrl+K command palette (jump to any page, book, order or customer).
   - Global admin search.
   - Saved filters.
   - Pagination or virtual scrolling for the 1,489-book list.
   - Inline quick edit for price and stock.
   - Empty states and loading skeletons.
   - Responsive down to tablet.
4. **Bulk tools.** CSV import/export for books (price and stock updates), with a preview diff before applying.
5. **Content.**
   - The hero slide picker selects a real book from the catalog (with a cover preview) instead of a free-text id.
   - Remove "★ 0.0" from author cards.
   - Author bio and photo editing is surfaced on the storefront author page.
6. **Reliability.**
   - Database indexes for ledger queries.
   - Sentry (env-driven) error monitoring.
   - Nightly Supabase backup reminder or export.
   - Playwright tests for: POS sale with stock deduction, a return, shift close totals, web order cancel releasing stock, and the forecast endpoint returning sane numbers on seeded data.

---

## Definition of done (premium quality bar)

- The Dashboard, Reports and Customers always agree, to the rupee.
- A cashier can scan 5 books and complete a cash sale with a printed receipt in under 20 seconds, keyboard only.
- No oversell across web and POS when both sell the last copy at the same time (covered by a test).
- Every forecast shows its data basis, and the reorder list matches a hand calculation for 3 sample books.
- Lighthouse on admin pages: Accessibility 95+. axe shows no serious violations.
- At the end, report: changelog, SQL migrations in run order, env vars, hardware notes (barcode scanner, 80 mm printer), and all CONFIRM items.
