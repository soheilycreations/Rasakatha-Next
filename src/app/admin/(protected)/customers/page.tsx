"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/format";

type CustomerSummary = {
  phone: string;
  name: string;
  email: string;
  totalSpent: number;
  webOrders: number;
  posSales: number;
  lastActivity: string;
  payments: Record<string, number>;
};

type Transaction = {
  id: string;
  source: "web" | "pos";
  createdAt: string;
  total: number;
  payment: string;
  items: { title: string; qty: number; price: number }[];
};

type CustomerDetail = {
  phone: string;
  name: string;
  email: string;
  totalSpent: number;
  transactionCount: number;
  transactions: Transaction[];
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  payhere: "PayHere",
  koko: "Koko BNPL",
  mintpay: "MintPay",
  cash: "Cash",
  card: "Card",
  other: "Other",
};

function CustomerDetailModal({ phone, onClose }: { phone: string; onClose: () => void }) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  useEffect(() => {
    fetch(`/api/admin/customers/${phone}`)
      .then((r) => r.json())
      .then(setDetail);
  }, [phone]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!detail ? (
          <p className="text-[13.5px] text-[var(--ink-faint)]">Loading customer…</p>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-[var(--ink)]">{detail.name || "Unnamed Customer"}</h3>
                <p className="mt-0.5 text-[13px] text-[var(--ink-faint)]">{detail.phone}</p>
                {detail.email && <p className="text-[13px] text-[var(--ink-faint)]">{detail.email}</p>}
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Lifetime Spend</div>
                <div className="font-sans text-[20px] font-extrabold tabular-nums text-[var(--ink)]">{money(detail.totalSpent)}</div>
              </div>
            </div>

            <h4 className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              {detail.transactionCount} Transaction{detail.transactionCount === 1 ? "" : "s"}
            </h4>
            <div className="flex flex-col gap-3">
              {detail.transactions.map((t) => (
                <div key={`${t.source}-${t.id}`} className="rounded-xl border border-[var(--border)] p-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                        t.source === "web" ? "bg-accent-blue/15 text-accent-blue" : "bg-accent/15 text-accent"
                      }`}
                    >
                      {t.source === "web" ? "Web Order" : "Shop Sale"} #{t.id}
                    </span>
                    <span className="text-[11.5px] text-[var(--ink-faint)]">
                      {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1">
                    {t.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-[12.5px] text-[var(--ink-dim)]">
                        <span className="truncate pr-2">
                          {item.title} × {item.qty}
                        </span>
                        <span className="shrink-0 text-[var(--ink)]">{money(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2 text-[12.5px]">
                    <span className="text-[var(--ink-faint)]">{PAYMENT_LABELS[t.payment] ?? t.payment}</span>
                    <span className="font-bold text-[var(--ink)]">{money(t.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={onClose} className="mt-5 w-full rounded-full border border-[var(--border)] py-2.5 text-[13px] font-semibold text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]">
          Close
        </button>
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      });
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q))
    : customers;

  const dominantPayment = (payments: Record<string, number>) => {
    const entries = Object.entries(payments).sort((a, b) => b[1] - a[1]);
    return entries[0] ? PAYMENT_LABELS[entries[0][0]] ?? entries[0][0] : "—";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Customers</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          {customers.length} customer{customers.length === 1 ? "" : "s"} across web orders and shop sales.
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone, or email…"
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50"
      />

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading customers…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-8 text-center text-[13.5px] text-[var(--ink-faint)]">
          {customers.length === 0 ? "No customers yet — they'll appear here once orders or sales come in." : "No customers match your search."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-faint)]">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Web Orders</th>
                <th className="px-4 py-3 font-semibold">Shop Sales</th>
                <th className="px-4 py-3 font-semibold">Usual Payment</th>
                <th className="px-4 py-3 font-semibold">Total Spent</th>
                <th className="px-4 py-3 font-semibold">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.phone}
                  onClick={() => setSelected(c.phone)}
                  className="cursor-pointer border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--surface-tint)]"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--ink)]">{c.name || "Unnamed"}</div>
                    <div className="text-[11.5px] text-[var(--ink-faint)]">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{c.webOrders}</td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{c.posSales}</td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{dominantPayment(c.payments)}</td>
                  <td className="px-4 py-3 font-semibold text-[var(--ink)]">{money(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--ink-faint)]">
                    {new Date(c.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <CustomerDetailModal phone={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
