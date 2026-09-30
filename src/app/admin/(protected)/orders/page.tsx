"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { money } from "@/lib/format";
import { ORDER_STATUS_STEPS, type OrderStatus, type StoredOrder } from "@/lib/orders";
import Toast from "../Toast";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  payhere: "PayHere",
  koko: "Koko BNPL",
  mintpay: "MintPay",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  processing: "#00aef0",
  packed: "#7c5cff",
  shipped: "#f0a500",
  delivered: "#2f5a3a",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [toast, setToast] = useState("");

  const load = () => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
      );
    });
  }, [orders, search, statusFilter]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const previous = orders.find((o) => o.id === id)?.status;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok && previous) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: previous } : o)));
      setToast("Could not update status. Try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Orders</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          {orders.length} order{orders.length === 1 ? "" : "s"} placed so far.
        </p>
      </div>

      {!loading && orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID, customer, or phone…"
            className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2.5 text-[13px] font-semibold text-[var(--ink)] focus:outline-none"
          >
            <option value="all" style={{ color: "#111", background: "#fff" }}>All statuses</option>
            {ORDER_STATUS_STEPS.map((s) => (
              <option key={s.key} value={s.key} style={{ color: "#111", background: "#fff" }}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-8 text-center text-[13.5px] text-[var(--ink-faint)]">
          No orders yet — placed orders will show up here.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-8 text-center text-[13.5px] text-[var(--ink-faint)]">
          No orders match your search.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-faint)]">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <Fragment key={o.id}>
                  <tr
                    className="cursor-pointer border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--surface-tint)]"
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">#{o.id}</td>
                    <td className="px-4 py-3 text-[var(--ink-dim)]">
                      {o.customer.name}
                      <div className="text-[11px] text-[var(--ink-faint)]">{o.customer.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-dim)]">{PAYMENT_LABELS[o.payment] ?? o.payment}</td>
                    <td className="px-4 py-3 font-semibold text-[var(--ink)]">{money(o.total)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                        style={{ color: STATUS_COLORS[o.status] }}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-2 py-1 text-[12px] font-semibold focus:outline-none"
                      >
                        {ORDER_STATUS_STEPS.map((s) => (
                          <option key={s.key} value={s.key} style={{ color: "#111", background: "#fff" }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--ink-faint)]">
                      {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-tint)]">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                              Items
                            </div>
                            <div className="flex flex-col gap-1">
                              {o.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-[12.5px]">
                                  <span className="text-[var(--ink-dim)]">
                                    {item.title} × {item.qty}
                                  </span>
                                  <span className="text-[var(--ink)]">
                                    {item.price != null ? money(item.price * item.qty) : "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                              Delivery Details
                            </div>
                            <div className="text-[12.5px] text-[var(--ink-dim)]">
                              {o.customer.isGift ? (
                                <>
                                  <div className="text-[var(--ink)]">Gift to: {o.customer.giftName}</div>
                                  <div>{o.customer.giftPhone}</div>
                                  <div>
                                    {o.customer.giftAddress}, {o.customer.giftCity}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-[var(--ink)]">{o.customer.email}</div>
                                  <div>
                                    {o.customer.address}, {o.customer.city}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
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

      {toast && <Toast message={toast} />}
    </div>
  );
}
