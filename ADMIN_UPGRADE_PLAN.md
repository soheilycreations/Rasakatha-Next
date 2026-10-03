# Rasakatha Back Office v2 — Admin + Premium POS (senior-dev spec)

> Hand this file to Claude Code. Work **one phase at a time**, in order. At the end of every phase:
> - run `npx tsc --noEmit`, `npm run lint`, `npm run build` and the full Playwright suite;
> - commit, push to a feature branch (`admin-v2-phase-N`), and give me the preview URL;
> - stop, report, and wait for my "merge" before starting the next phase.
>
> Ask me before running any SQL on production, deleting data, or merging to master. Read `AGENTS.md` and `node_modules/next/dist/docs/` before writing Next.js code.

## Business context (confirmed by the owner)

- **One shop + the website.** A warehouse is not needed now. Model `location_id` anyway, so a book-fair stall or a second location can be added later without a rewrite.
- **Staff: 3–5 people.** Roles: Owner, Manager, Cashier, Stock keeper.
- **Hardware:** today there is only a laptop. Planned:
  - USB barcode scanner
  - 80 mm thermal receipt printer (with cash drawer)
  - tablet / touch screen at the counter

  Everything must work on the laptop now and on the touch screen later.
- **Business flows the system must handle:**
  1. **Consignment books.** Other publishers' books are sold, and they are paid per copy sold.
  2. **Author royalties** on Rasakatha titles.
  3. **Schools / libraries on credit:** invoices, payment later, statements.
  4. **Pre-orders with deposits**, e.g. "Mai Wahi – Pre Order".

## What's wrong today (live review, 3 Oct 2026)

- **The Dashboard ignores POS sales.** It shows web revenue only (Rs. 9,500), while Reports shows Rs. 37,730.
- **Customers don't link across channels.** A shop sale billed to a named customer shows 0 shop sales for that customer.
- **Stock is a flag, not a number.** There is no movement history, no cost price, so no profit.
- **The POS is basic:**
  - about 2 s search delay
  - a "How many copies?" step on every add
  - no scan, receipt, shift, return, offline mode or touch layout
- **Web orders:** no cancel/return/refund status, payment status, tracking, invoice/packing slip, bulk actions or timeline.
- **Books admin:** placeholder-only form labels, missing list thumbnails, no bulk tools, hard delete.
- **One shared password for everyone,** with no audit trail.

---

## Engineering standards (apply to every phase)

- **Money:** `numeric(12,2)` in the database and integer cents in TypeScript calculations. A single `money()` formatter.
- **Every write that touches stock or money** goes through a Postgres function (RPC) in one transaction, with an idempotency key. Never do read-then-write from Node.
- **Validation:** zod schemas shared by the client and the server for every API/server action.
- **Security:**
  - Staff use Supabase Auth with a role claim.
  - RLS is on for every table.
  - The service-role key is used only in server code.
  - Permissions are checked on the server for every action, never only in the UI.
- **Audit:** an `audit_log` row (actor, action, entity, before/after JSON, IP, time) for every create/update/delete on books, prices, stock, orders, payments, customers and settings.
- **Never hard-delete business data.** Use `archived_at` / `voided_at` with a reason.
- **UI system:** build a small admin design system first (`src/components/admin/ui/*`):
  - Button, IconButton, Input with a visible label, Select, Combobox, Dialog, Drawer, Toast with undo, DataTable (sort, filter, column chooser, sticky header, virtual rows), StatCard, Chart wrapper, EmptyState, Skeleton, Badge, Kbd.
  - Use it on every admin page.
  - Use the existing dark/red tokens, keyboard-first focus, and touch targets of at least 44 px.
- **Performance:** admin lists paginate on the server, and search is debounced (or local for the POS). No table renders more than about 100 DOM rows at once.
- **Tests:** a Playwright scenario for each business flow (listed per phase) and unit tests for the money and stock functions.

---

## Phase 0 — Foundations

1. **Staff accounts and roles.**
   - Supabase Auth users with the roles `owner`, `manager`, `cashier`, `stock`.
   - Login with email and password, plus a 4–6 digit **POS PIN** for fast cashier switching at the till.
   - 2FA (TOTP) for owner and manager.
   - A permission matrix in one file.
   - A cashier cannot see cost prices, profit, payouts or settings, cannot delete, and has a configurable discount limit (default 10%).
   - Keep the env-password owner login as a disabled-by-default emergency fallback.
2. **Audit log**, with a viewer at `/admin/audit` (filter by user, entity and date).
3. **Settings page** for:
   - store name, address and phone
   - receipt header and footer
   - tax/VAT on or off (default off)
   - discount limits per role
   - low-stock threshold
   - royalty and consignment defaults
   - credit terms
   - courier list
4. **Admin UI kit** as described in the engineering standards. Refit the existing pages to use it:
   - visible labels on the book form
   - working cover thumbnails in lists
   - a slide-over drawer for row details instead of reflowing rows
5. **A Ctrl+K command palette:** jump to any page, book (title/ISBN), order, invoice or customer, plus quick actions like "New sale" and "Receive stock".

**Tests for Phase 0:**
- A cashier cannot open settings or see cost prices (server-side 403).
- Every change writes an audit row.

## Phase 1 — One source of truth: sales, stock and customers

1. **Catalog additions.**
   - Fields: `cost_price`, `barcode` (ISBN or internal), `sku`, `reorder_level`, `supplier_id`, `ownership` (`own | purchased | consignment`), `royalty_contract_id`, `location_id`.
   - Books without an ISBN get an internal barcode (e.g. `RK000123`, Code128).
2. **Inventory ledger.**
   - Table `stock_movements` (`book_id, location_id, delta, reason, ref_type, ref_id, unit_cost, actor, at`).
   - Reasons: `sale_pos`, `sale_web`, `return`, `receive`, `adjust`, `reserve`, `release`, `consign_in`, `consign_return`, `damage`, `stocktake`.
   - `stock_on_hand` and `stock_reserved` are maintained by RPCs with row locks, so web and POS can never oversell the last copy.
   - Web orders reserve stock when placed, deduct it when packed or shipped, and release it when cancelled.
   - POS deducts stock immediately.
3. **Stock take mode.**
   - Scan or type counts on a fast keyboard/touch grid, filtered by category or shelf.
   - Show the variance report before applying it, then apply it as `stocktake` movements.
   - This is the first job after deploy, to seed real quantities for all 1,489 books.
4. **Suppliers and Goods Received (GRN).**
   - Supplier records include terms (purchase vs consignment), lead time in days, and contact details.
   - A GRN updates stock and the weighted-average cost.
5. **Unified sales ledger.**
   - SQL view `sales_ledger`, one row per line, across `pos` / `web` / `invoice` / `web_legacy`.
   - Columns: line revenue, discount, cost, gross profit, customer, channel, payment status.
   - The Dashboard, Reports, Customers and all insights read only from this ledger, so every page agrees to the rupee.
6. **Customers.**
   - One `customers` table keyed by normalized phone (`+947…`) with email as a secondary key.
   - Types: `retail`, `institution` (school/library), `author`, `supplier-contact`.
   - Backfill all web orders and POS sales; name-only sales get a suggested match, which the owner confirms.
   - Add a merge tool.
7. **History import.** Load the old WooCommerce orders (`Last_100_Orders.xlsx` and the `old site/` dump) as `web_legacy`, so the insights in Phase 5 have data. Report the counts.

**Tests for Phase 1:**
- Two parallel sales of the last copy (POS + web): exactly one succeeds.
- Cancelling a web order releases its reserved stock.
- A GRN updates stock and cost.
- Dashboard total = Reports total = sum of the ledger.

## Phase 2 — Premium POS ("next level")

### Layout and look

The POS is a full-screen route (`/pos`) with its own chrome. It does not sit inside the admin sidebar.

- **Three zones on laptop and touch screens (≥1024 px):**
  1. **Left — Catalog:**
     - a big search box at the top
     - quick tiles under it: Best sellers, Rasakatha titles, Pre-orders, Recently sold, and favourites the owner can pin
     - a cover grid with price and a stock badge
  2. **Centre — Bill:**
     - large readable lines with cover thumb, title, qty stepper, line discount and line total
     - running item count
     - the customer chip at the top
  3. **Right — Pay panel:**
     - a huge TOTAL
     - savings
     - payment method buttons (Cash, Card, Bank transfer, Credit/Invoice, Split)
     - a numeric keypad
     - quick cash buttons: exact, Rs. 1,000 / 2,000 / 5,000
     - change due in large green text
     - a single primary "Complete sale" button
- **Tablets (768–1023 px):** two zones (Catalog / Bill) with a slide-up Pay sheet.
- **Visual quality:**
  - dark premium surface with subtle depth (no heavy blur)
  - Playfair for totals and headings
  - smooth 150 ms micro-animations: item added, qty change, sale complete
  - a success screen with a receipt preview
- **Status bar:** cashier name and avatar, shift state with cash in drawer, Online/Offline badge with queued count, printer status, a clock, and a "Lock" button (switch cashier by PIN).
- **Customer-facing display (`/pos/display`):** opens on a second screen or tablet. It shows the bill live, the total, savings and a thank-you message, synced via BroadcastChannel and Supabase Realtime.
- **Installable as a PWA** (full-screen, app icon), with a light theme option.

### Speed

- The full catalog index (id, title halves, author, barcode/ISBN, price, stock, cover thumb) is loaded into memory and IndexedDB.
- Search is local, diacritic- and Singlish-tolerant, and returns results in under 50 ms.
- The index refreshes in the background every 5 minutes and after each GRN.
- **Scan-first:** a scanner (keyboard wedge) is detected by input speed, and the book is added instantly with qty 1. Scanning again increments the quantity. An unknown barcode gives a quick "Assign barcode to a book" flow (manager+).
- **Keyboard:** F2 search, F3 customer, F4 hold, F6 recall, F8 discount, F9 pay, F12 complete, Esc clear. Show shortcut hints with `Kbd` components.
- **Target:** scan 5 books and complete a cash sale with a printed receipt in under 15 s.

### Sale features

- Line and bill discounts (percentage or amount) with a reason, capped by the role limit. A manager PIN override goes above the limit.
- **Split payments** across any mix of methods.
- **Credit sale to an institution:** this creates an invoice (Phase 3) instead of taking payment.
- **Hold / recall bills,** stored on the server (survives a refresh or a device change).
- **Customer:** search by phone or name, quick-add, and show lifetime spend, last visit, outstanding credit and active pre-orders.
- **Pre-order at the till:** take a deposit or full payment against a pre-order title (Phase 3 model).
- **Returns / exchanges:**
  - Scan the receipt QR code or enter the sale number, then pick lines.
  - Refund to cash, card or store credit, or exchange.
  - Stock is returned. A reason is required, and a manager PIN is needed above a set amount.
- **Gift vouchers / store credit** (simple balance per code or customer).

### Receipts and hardware

- **80 mm thermal receipt** using the browser print path (`@page { size: 80mm auto; margin: 0 }`), with a dedicated receipt template. The receipt shows:
  - logo (monochrome), store details and receipt number
  - cashier and date/time
  - lines, discounts and savings
  - payments and change
  - a QR code to the receipt or book page
  - the footer from Settings
- **Reprint** from sales history. Offer an **e-receipt** by SMS/WhatsApp link or email when the customer has a phone or email.
- **Cash drawer:**
  - Default: the printer's driver setting "open drawer on print".
  - Optional advanced mode: send ESC/POS directly via WebUSB/WebSerial (Chrome) for silent printing and drawer kick, behind a Settings toggle with a "Test printer" button.
- **Shelf/book labels:** print Code128 barcode labels for books without an ISBN (sheet layout and the 80 mm roll).

### Shifts and cash control

- **Open shift:** opening float, counted by denomination.
- **Cash in/out** with a reason (e.g. petty cash).
- **Close shift:**
  - blind count by denomination
  - expected vs counted, with over/short highlighted
  - a printable **Z-report** (sales by method, discounts, returns, voids, deposits taken, credit invoices raised, cashier)
- An X-report (mid-shift) at any time.
- A shift history for owner and manager.

### Offline mode (power or internet cuts)

- When offline, sales keep working from the local index and are queued in IndexedDB with idempotency keys.
- Receipts still print.
- Show an "Offline: N sales waiting" badge.
- When back online, sync automatically and handle conflicts (e.g. stock went negative) with a review list for the manager.

**Tests for Phase 2:**
- Scan → add → pay cash → change calculated → receipt rendered.
- A split payment.
- Hold/recall across a page reload.
- A return restocks the books.
- A discount above the limit requires a manager PIN.
- Shift close totals match the sales.
- An offline sale queues and then syncs exactly once.
- The display screen mirrors the bill.

## Phase 3 — Orders, invoices and pre-orders

1. **Web orders.**
   - Statuses: `pending_payment`, `placed`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded`.
   - Plus `payment_status`, `courier`, `tracking_no`, internal notes and an `order_events` timeline.
   - Queue tabs: New, To pack, To ship, In transit, Problems — with badge counts in the sidebar.
   - A slide-over order detail.
   - Bulk actions: confirm, pack, ship, print.
   - A4 invoice and packing slip, plus bulk print.
   - Courier CSV export (configurable format, marked CONFIRM).
   - Customer SMS/email on status changes.
   - **COD reconciliation:** delivered vs cash collected per courier remittance.
2. **Institutional credit (schools/libraries).**
   - Institution customers have a credit limit and payment terms (e.g. 30 days), plus contact and billing details.
   - **Quotation → Invoice** (with PO number), raised from admin or from the POS "Credit" payment.
   - Partial payments and receipts against invoices.
   - **Statement of account** PDF.
   - **Aging report** (0–30 / 31–60 / 61–90 / 90+).
   - Overdue reminders (email/SMS).
   - Block new credit above the limit unless a manager overrides it.
3. **Pre-orders and deposits.**
   - Pre-order titles have a release date, a pre-order price, and a minimum deposit (amount or percentage).
   - Take a deposit or full payment on web or at the POS. The deposit is held as a customer liability, not as revenue, until fulfilment.
   - **When stock arrives (GRN):** allocate copies to pre-orders in order, then notify those customers (SMS/email).
   - **Fulfil:** collect the balance, then the sale becomes revenue.
   - Cancellation refunds the deposit, with the policy marked CONFIRM.
   - **Pre-order demand report** to guide print runs.

**Tests for Phase 3:**
- Invoice → partial payment → aging updates.
- Credit limit block and override.
- Pre-order deposit → GRN allocation → balance collection → revenue recognised.
- Cancelling an order releases its stock.

## Phase 4 — Partner money: consignment and royalties

1. **Consignment.**
   - Consignment suppliers have terms: payable per copy sold, at either a fixed cost or a percentage of the selling price.
   - `consign_in` movements track stock received; stock that isn't sold can be returned to the supplier (`consign_return`).
   - **Settlement report per supplier per period:** opening stock, received, sold (from the ledger), returned, closing stock, and amount payable.
   - **Payouts:** record payments, with a printable settlement statement PDF.
   - The amount owed to each consignor is always visible on the supplier page.
2. **Author royalties (Rasakatha titles).**
   - **Royalty contracts per title:**
     - author(s) with split percentages
     - basis: list price or net receipts
     - rate, optionally tiered by copies sold
     - channel overrides (web / POS / institution)
     - advance amount, recouped from royalties before any payout
     - period (quarterly or half-yearly)
   - **Royalty statement per author per period:** units and revenue by title and channel, royalty earned, advance recouped, balance payable.
   - Statements are produced as PDFs, and payouts are recorded against them.
   - The calculation is reproducible: statements are frozen once issued, and later corrections appear as adjustments in the next period.
   - Optional author portal later (read-only statements), out of scope now.

**Tests for Phase 4:**
- Consignment settlement equals sold units × terms.
- A royalty with an advance recoups correctly across two periods.
- Issued statements don't change when new sales arrive.

## Phase 5 — Insights and predictions

All computed server-side from `sales_ledger` + `stock_movements`, cached for 1 h.

Every chart says what data it is based on. Forecasts are hidden or labelled "not enough history" when there's less than about 8 weeks of data.

1. **Owner dashboard (new home of the admin).**
   - Today / yesterday / week / month for revenue, gross profit, orders, units, AOV, POS vs web split, and deltas vs the previous period.
   - Cash expected in the drawer.
   - Orders needing action.
   - Overdue invoices.
   - Consignment and royalties payable.
   - Low stock.
   - Pre-orders awaiting stock.
   - Top books and categories.
2. **Demand forecast per book.**
   - Daily units across all channels.
   - Exponential smoothing with day-of-week factors and Sri Lanka seasonality flags:
     - April Avurudu
     - September Colombo International Book Fair
     - December holidays
     - school-term starts for children's and educational books
     - Valentine's Day / Women's Day for the gift collections
   - Output: 7/30/90-day forecasts with a confidence band.
3. **Reorder assistant.**
   - Days of cover; suggested quantity = forecast × (lead time + review period) + safety stock − (on hand + on order − reserved).
   - Grouped by supplier, then one click creates a purchase list (print/CSV).
   - For Rasakatha titles, show a **reprint suggestion** (print-run guidance from the forecast plus pre-order demand).
4. **Stock health.**
   - ABC analysis.
   - Dead stock at 90/180 days, with the value tied up.
   - Sell-through rate.
   - Margin by title, category and supplier.
5. **Customers.**
   - RFM segments, repeat rate, time to second purchase, churn risk.
   - Institution buying patterns (school-term cycles).
   - Consented-only export for SMS/WhatsApp campaigns, with an opt-out flag.
6. **Recommendations.**
   - "Bought together" from co-purchases.
   - Shown on the storefront book page, and as POS upsell hints in the bill zone.
7. **Daily 8 am owner summary** (email/SMS):
   - yesterday's sales and profit
   - cash over/short
   - low stock
   - orders to ship
   - overdue invoices
   - anomalies (sales more than 2σ below normal, sudden spikes)
8. **Exports:** CSV/Excel on every table, and an accountant pack for the month (sales, payments, payouts, stock valuation).

**Tests for Phase 5:**
- Forecast and reorder numbers match a hand calculation for 3 seeded books.
- Insights are hidden when there isn't enough data.

## Phase 6 — Polish and hardening

- Bulk book tools: CSV import/export with a preview diff, and inline quick edit for price and stock.
- A hero slide picker that selects a real catalog book.
- Remove the "★ 0.0" noise from author cards.
- Sentry (env-driven) error monitoring.
- Database indexes for ledger queries.
- A nightly backup export.
- An uptime check.
- Accessibility pass (axe clean), and Lighthouse Accessibility 95+ on admin pages.
- Staff training mode: a POS sandbox with fake data that doesn't touch real stock or money.

---

## Hardware notes (for the owner)

- **Barcode scanner:** any USB 1D/2D scanner in "keyboard (HID) mode" that reads EAN-13 (ISBN) and Code128. 2D is recommended so it can also read receipt QR codes.
- **Receipt printer:** an 80 mm thermal printer with USB and an RJ11 cash-drawer port. Install the Windows driver, set the paper to 80 mm, and enable "open drawer" in the driver.
- **Touch screen / tablet:** a 13–15" touch monitor on the counter laptop, or a 10–11" tablet running the POS as an installed PWA (Chrome). A second small tablet can be the customer display.
- **Internet:** keep a mobile-data backup. The POS works offline, but card payments and syncing need a connection.

## Definition of done

- The Dashboard, Reports, Customers and the ledger always agree to the rupee.
- The POS is scan-first and keyboard/touch friendly, works offline, prints receipts, and closes shifts with a Z-report.
- No oversell across web and POS (covered by a test).
- Consignment settlements and royalty statements are reproducible and can be exported as PDFs.
- Credit invoices have aging, and pre-orders track deposits as liabilities.
- Every money or stock change is audited and attributable to a staff user.
- Each phase ships to a preview first, and goes to master only after my approval.
