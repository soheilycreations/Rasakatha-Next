"use client";

import { Fragment, useEffect, useState } from "react";
import { money } from "@/lib/format";
import { POS_PAYMENT_LABELS, type PosSale } from "@/lib/pos";

export default function AdminPosSalesPage() {
  const [sales, setSales] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/pos/sales")
      .then((r) => r.json())
      .then((data) => {
        setSales(data);
        setLoading(false);
      });
  }, []);

  const totalToday = sales
    .filter((s) => s.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Shop Sales</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
            {sales.length} in-store sale{sales.length === 1 ? "" : "s"} recorded · {money(totalToday)} today
          </p>
        </div>
        <a href="/admin/pos" className="btn-accent rounded-full px-5 py-2.5 text-[13px] font-bold text-white">
          + New Sale
        </a>
      </div>

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading sales…</p>
      ) : sales.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-8 text-center text-[13.5px] text-[var(--ink-faint)]">
          No in-store sales yet — bill your first customer from Point of Sale.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-faint)]">
                <th className="px-4 py-3 font-semibold">Sale</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <Fragment key={s.id}>
                  <tr
                    className="cursor-pointer border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--surface-tint)]"
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">#{s.id}</td>
                    <td className="px-4 py-3 text-[var(--ink-dim)]">{s.customerName || "Walk-in"}</td>
                    <td className="px-4 py-3 text-[var(--ink-dim)]">{s.items.reduce((n, i) => n + i.qty, 0)} item(s)</td>
                    <td className="px-4 py-3 text-[var(--ink-dim)]">{POS_PAYMENT_LABELS[s.payment]}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">{money(s.total)}</td>
                    <td className="px-4 py-3 text-[12px] text-[var(--ink-faint)]">
                      {new Date(s.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </td>
                  </tr>
                  {expanded === s.id && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-tint)]">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          {s.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-[12.5px]">
                              <span className="text-[var(--ink-dim)]">
                                {item.title} × {item.qty}
                              </span>
                              <span className="text-[var(--ink)]">{money(item.price * item.qty)}</span>
                            </div>
                          ))}
                          {s.discount > 0 && (
                            <div className="flex justify-between border-t border-[var(--border)] pt-1.5 text-[12.5px] text-[var(--ink-dim)]">
                              <span>Discount</span>
                              <span>-{money(s.discount)}</span>
                            </div>
                          )}
                          {s.note && <div className="mt-1 text-[12px] italic text-[var(--ink-faint)]">Note: {s.note}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
