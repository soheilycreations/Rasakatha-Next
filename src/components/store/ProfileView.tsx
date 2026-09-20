"use client";

import { useEffect, useState } from "react";
import type { Account } from "@/lib/account";
import type { StoredOrder } from "@/lib/orders";
import { money } from "@/lib/format";
import OrderStatusTracker from "./OrderStatusTracker";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors";

export default function ProfileView({
  account,
  onUpdated,
  onSignOut,
}: {
  account: Account;
  onUpdated: (account: Account) => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<StoredOrder[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Could not save");
      return;
    }
    onUpdated(data);
    setMessage("Saved");
  };

  const initials = (account.name || account.email).slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-accent text-lg font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display truncate text-xl font-bold text-[var(--ink)]">{account.name || "My Profile"}</h3>
          <p className="truncate text-[13px] text-[var(--ink-faint)]">{account.email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="rounded-full border border-[var(--border)] px-4 py-2 text-[12.5px] font-semibold text-[var(--ink-dim)] transition-colors hover:border-accent/40 hover:text-accent"
        >
          Sign Out
        </button>
      </div>

      <form onSubmit={save} className="rounded-2xl border border-[var(--border)] bg-card p-5">
        <h4 className="mb-3 text-[15px] font-bold text-[var(--ink)]">Account Details</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputClass} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={inputClass} placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-accent rounded-full px-6 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          {message && <span className="text-[12.5px] text-[var(--ink-dim)]">{message}</span>}
        </div>
      </form>

      <h4 className="mb-3 mt-8 text-[15px] font-bold text-[var(--ink)]">My Orders</h4>
      {orders === null ? (
        <p className="text-[13px] text-[var(--ink-faint)]">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-6 text-center text-[13.5px] text-[var(--ink-faint)]">
          No orders yet. Orders placed with {account.email} will appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[var(--border)] bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold text-[var(--ink)]">Order #{o.id}</span>
                <span className="text-[12px] text-[var(--ink-faint)]">
                  {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div className="my-4">
                <OrderStatusTracker status={o.status} />
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-[13px]">
                <span className="text-[var(--ink-dim)]">{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</span>
                <span className="font-extrabold text-[var(--ink)]">{money(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
