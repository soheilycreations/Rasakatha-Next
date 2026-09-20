"use client";

import { useState } from "react";
import type { StoredOrder } from "@/lib/orders";
import { ORDER_STATUS_STEPS } from "@/lib/orders";
import { money } from "@/lib/format";
import OrderStatusTracker from "./OrderStatusTracker";
import { IconTruck } from "./icons";

export default function TrackOrderView({ initialOrder }: { initialOrder?: StoredOrder }) {
  const [orderId, setOrderId] = useState(initialOrder?.id ?? "");
  const [phone, setPhone] = useState(initialOrder?.customer.phone ?? "");
  const [order, setOrder] = useState<StoredOrder | undefined>(initialOrder);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(undefined);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/[0.12] text-accent">
          <IconTruck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-[var(--ink)]">Track Your Order</h3>
          <p className="text-[13px] text-[var(--ink-faint)]">Enter your order ID and phone number to check its status.</p>
        </div>
      </div>

      <form onSubmit={handleLookup} className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputClass} placeholder="Order ID (e.g. 48213)" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          <input className={inputClass} placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <p className="text-[12.5px] text-accent">{error}</p>}
        <button type="submit" disabled={loading} className="btn-accent self-start rounded-full px-6 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
          {loading ? "Searching…" : "Track Order"}
        </button>
      </form>

      {order && (
        <div className="fade-rise mt-6 rounded-2xl border border-[var(--border)] bg-card p-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-[13px] font-semibold text-[var(--ink)]">Order #{order.id}</span>
            <span className="text-[12px] text-[var(--ink-faint)]">
              Placed {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div className="my-5">
            <OrderStatusTracker status={order.status} />
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3.5">
            <span className="text-[13.5px] text-[var(--ink-dim)]">
              {order.items.reduce((s, i) => s + i.qty, 0)} item(s)
            </span>
            <span className="text-[16px] font-extrabold text-[var(--ink)]">{money(order.total)}</span>
          </div>
        </div>
      )}

      <p className="mt-4 text-center text-[11.5px] text-[var(--ink-faint)]">
        Statuses update as your order moves through {ORDER_STATUS_STEPS.map((s) => s.label.toLowerCase()).join(" → ")}.
      </p>
    </div>
  );
}
