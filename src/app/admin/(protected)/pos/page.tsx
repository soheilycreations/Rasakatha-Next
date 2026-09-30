"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import type { PosPaymentMethod, PosSale, PosSaleItem } from "@/lib/pos";
import { POS_PAYMENT_LABELS } from "@/lib/pos";
import { money } from "@/lib/format";
import Toast from "../Toast";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function ReceiptModal({ sale, onClose }: { sale: PosSale; onClose: () => void }) {
  return (
    <>
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-center text-[11px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
          Rasakatha Bookstore
        </div>
        <h3 className="text-center text-[15px] font-bold text-[var(--ink)]">Sale #{sale.id}</h3>
        <p className="text-center text-[11.5px] text-[var(--ink-faint)]">
          {new Date(sale.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </p>

        <div className="my-4 flex flex-col gap-1.5 border-y border-dashed border-[var(--border)] py-4">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between text-[13px]">
              <span className="text-[var(--ink-dim)]">
                {item.title} × {item.qty}
              </span>
              <span className="text-[var(--ink)]">{money(item.price * item.qty)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-[13px] text-[var(--ink-dim)]">
          <span>Subtotal</span>
          <span>{money(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="mt-1 flex justify-between text-[13px] text-[var(--ink-dim)]">
            <span>Discount</span>
            <span>-{money(sale.discount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between text-[16px] font-extrabold text-[var(--ink)]">
          <span>Total</span>
          <span>{money(sale.total)}</span>
        </div>
        <p className="mt-1 text-center text-[12px] text-[var(--ink-faint)]">Paid via {POS_PAYMENT_LABELS[sale.payment]}</p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-full border border-[var(--border)] py-3 text-[13.5px] font-bold text-[var(--ink)] hover:bg-[var(--surface-tint)]"
          >
            Print Receipt
          </button>
          <button onClick={onClose} className="btn-accent flex-1 rounded-full py-3 text-[13.5px] font-bold text-white">
            New Sale
          </button>
        </div>
      </div>
    </div>

      {/* Thermal-printer-only receipt; hidden on screen, shown via print CSS in globals.css */}
      <div id="pos-print-area" className="hidden">
        <div className="receipt-print">
          <div className="receipt-center receipt-bold">Rasakatha Bookstore</div>
          <div className="receipt-center">Sale #{sale.id}</div>
          <div className="receipt-center">{new Date(sale.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</div>
          <div className="receipt-rule" />
          {sale.items.map((item) => (
            <div key={item.id} className="receipt-row">
              <span>
                {item.title} x{item.qty}
              </span>
              <span>{money(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="receipt-rule" />
          <div className="receipt-row">
            <span>Subtotal</span>
            <span>{money(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="receipt-row">
              <span>Discount</span>
              <span>-{money(sale.discount)}</span>
            </div>
          )}
          <div className="receipt-row receipt-bold">
            <span>TOTAL</span>
            <span>{money(sale.total)}</span>
          </div>
          <div className="receipt-center">Paid via {POS_PAYMENT_LABELS[sale.payment]}</div>
          <div className="receipt-center" style={{ marginTop: 8 }}>
            Thank you for shopping with us!
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminPosPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [results, setResults] = useState<CatalogBook[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [searching, setSearching] = useState(false);
  const [pendingBook, setPendingBook] = useState<CatalogBook | null>(null);
  const [pendingQty, setPendingQty] = useState("1");
  const [bill, setBill] = useState<PosSaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PosPaymentMethod>("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<PosSale | null>(null);
  const [toast, setToast] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      queueMicrotask(() => setResults([]));
      return;
    }
    queueMicrotask(() => setSearching(true));
    fetch(`/api/admin/books?search=${encodeURIComponent(debouncedQuery)}&limit=8`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.items);
        setHighlight(0);
        setSearching(false);
      });
  }, [debouncedQuery]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (pendingBook) {
      queueMicrotask(() => {
        qtyRef.current?.focus();
        qtyRef.current?.select();
      });
    }
  }, [pendingBook]);

  const selectBook = (book: CatalogBook) => {
    setPendingQty("1");
    setPendingBook(book);
  };

  const addToBill = (book: CatalogBook, qty: number) => {
    const price = book.onSale && book.salePrice ? book.salePrice : book.regularPrice;
    setBill((prev) => {
      const existing = prev.find((i) => i.id === book.id);
      if (existing) return prev.map((i) => (i.id === book.id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { id: book.id, title: book.title, price, qty }];
    });
  };

  const confirmPendingQty = () => {
    if (!pendingBook) return;
    const qty = Math.max(1, Math.floor(Number(pendingQty)) || 1);
    addToBill(pendingBook, qty);
    setPendingBook(null);
    setQuery("");
    setResults([]);
    queueMicrotask(() => searchRef.current?.focus());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const book = results[highlight];
      if (book && book.inStock) selectBook(book);
    } else if (e.key === "Escape") {
      setQuery("");
      setResults([]);
    }
  };

  const changeQty = (id: string, delta: number) =>
    setBill((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));

  const removeItem = (id: string) => setBill((prev) => prev.filter((i) => i.id !== id));

  const subtotal = bill.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const completeSale = async () => {
    if (bill.length === 0) {
      setError("Add at least one item to the bill");
      return;
    }
    setCompleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pos/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: bill, discount, payment, customerName, customerPhone, customerEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not complete the sale");
        return;
      }
      setReceipt(data);
      setBill([]);
      setDiscount(0);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setPayment("cash");
      setQuery("");
      setResults([]);
      setToast("Sale completed");
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setCompleting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50";

  return (
    <>
    <div className="flex flex-col gap-6 print:hidden">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Point of Sale</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          Bill in-store customers — kept separate from web orders. Search, use ↑↓ + Enter to add fast.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          {pendingBook ? (
            <div className="flex items-center gap-3 rounded-xl border border-accent bg-accent/[0.06] p-3">
              {pendingBook.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pendingBook.cover} alt="" className="h-14 w-10 shrink-0 rounded-md border border-[var(--border)] object-cover" />
              ) : (
                <div className="grid h-14 w-10 shrink-0 place-items-center rounded-md bg-[var(--surface-tint-strong)] text-[8px] text-[var(--ink-faint)]">
                  No cover
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-[var(--ink)]">{pendingBook.title}</div>
                <div className="text-[11.5px] text-[var(--ink-faint)]">How many copies?</div>
              </div>
              <input
                ref={qtyRef}
                type="number"
                min={1}
                value={pendingQty}
                onChange={(e) => setPendingQty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmPendingQty();
                  } else if (e.key === "Escape") {
                    setPendingBook(null);
                    queueMicrotask(() => searchRef.current?.focus());
                  }
                }}
                className="w-16 rounded-lg border border-accent bg-[var(--surface-tint)] px-2 py-2 text-center text-[14px] font-bold text-[var(--ink)] focus:outline-none"
              />
              <button onClick={confirmPendingQty} className="btn-accent shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold text-white">
                Add (Enter)
              </button>
            </div>
          ) : (
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Type a title or ID, ↑↓ to pick, Enter to add…"
              className={inputClass}
              autoFocus
            />
          )}

          {searching && <p className="text-[12.5px] text-[var(--ink-faint)]">Searching…</p>}

          {!pendingBook && results.length > 0 && (
            <div className="flex flex-col gap-1 rounded-2xl border border-[var(--border)] bg-card p-2">
              {results.map((book, i) => {
                const price = book.onSale && book.salePrice ? book.salePrice : book.regularPrice;
                const active = i === highlight;
                return (
                  <button
                    key={book.id}
                    onClick={() => book.inStock && selectBook(book)}
                    onMouseEnter={() => setHighlight(i)}
                    disabled={!book.inStock}
                    className={`flex items-center gap-3 rounded-xl p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active ? "bg-accent/[0.1] ring-1 ring-accent/40" : "hover:bg-[var(--surface-tint)]"
                    }`}
                  >
                    {book.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.cover} alt="" className="h-14 w-10 shrink-0 rounded-md border border-[var(--border)] object-cover" />
                    ) : (
                      <div className="grid h-14 w-10 shrink-0 place-items-center rounded-md bg-[var(--surface-tint-strong)] text-[8px] text-[var(--ink-faint)]">
                        No cover
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[var(--ink)]">{book.title}</div>
                      <div className="truncate text-[11.5px] text-[var(--ink-faint)]">{book.author}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[13px] font-bold text-[var(--ink)]">{money(price)}</div>
                      {!book.inStock && <div className="text-[10.5px] text-accent">Out of stock</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2">
            <h4 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">Current Bill</h4>
            {bill.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-[13px] text-[var(--ink-faint)]">
                Search for a book above to start a new bill.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {bill.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[var(--ink)]">{item.title}</div>
                      <div className="text-[11.5px] text-[var(--ink-faint)]">{money(item.price)} each</div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-tint)] px-1.5 py-1">
                      <button onClick={() => changeQty(item.id, -1)} className="grid h-6 w-6 place-items-center rounded-full text-[var(--ink-dim)] hover:bg-accent hover:text-white">
                        −
                      </button>
                      <span className="min-w-[16px] text-center text-[12.5px] font-bold text-[var(--ink)]">{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)} className="grid h-6 w-6 place-items-center rounded-full text-[var(--ink-dim)] hover:bg-accent hover:text-white">
                        +
                      </button>
                    </div>
                    <div className="w-20 shrink-0 text-right text-[13px] font-bold text-[var(--ink)]">{money(item.price * item.qty)}</div>
                    <button onClick={() => removeItem(item.id)} className="shrink-0 text-[var(--ink-faint)] hover:text-accent">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky top-4 h-fit rounded-2xl border border-[var(--border)] bg-card p-5">
          <h4 className="mb-4 text-[15px] font-bold text-[var(--ink)]">Checkout</h4>
          <div className="flex flex-col gap-2.5">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className={inputClass}
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number (optional)"
              className={inputClass}
            />
            <input
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              type="email"
              placeholder="Email address (optional)"
              className={inputClass}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["cash", "card", "other"] as PosPaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPayment(m)}
                className={`rounded-xl border px-2 py-2 text-[12.5px] font-bold transition-colors ${
                  payment === m ? "border-accent bg-accent/[0.1] text-accent" : "border-[var(--border)] text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]"
                }`}
              >
                {POS_PAYMENT_LABELS[m]}
              </button>
            ))}
          </div>

          <div className="my-4 h-px bg-[var(--border)]" />

          <div className="flex items-center justify-between text-[13.5px] text-[var(--ink-dim)]">
            <span>Subtotal</span>
            <span className="text-[var(--ink)]">{money(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[13.5px] text-[var(--ink-dim)]">
            <span>Discount</span>
            <input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-24 rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-2 py-1 text-right text-[13px] text-[var(--ink)] focus:outline-none focus:border-accent/50"
            />
          </div>

          <div className="my-4 h-px bg-[var(--border)]" />
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[var(--ink)]">Total</span>
            <span className="text-[22px] font-extrabold text-[var(--ink)]">{money(total)}</span>
          </div>

          {error && <p className="mt-3 text-[12.5px] font-semibold text-accent">{error}</p>}

          <button
            onClick={completeSale}
            disabled={completing || bill.length === 0}
            className="btn-accent mt-5 w-full rounded-full py-3.5 text-[13.5px] font-bold text-white disabled:opacity-50"
          >
            {completing ? "Completing…" : "Complete Sale"}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
    {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </>
  );
}
