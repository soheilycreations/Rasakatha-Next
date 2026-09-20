"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { money } from "@/lib/format";

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenue7d: number;
  growthPct: number;
  daily: { date: string; label: string; revenue: number; orders: number }[];
  paymentBreakdown: { method: string; count: number }[];
  topBooks: { title: string; qty: number; revenue: number }[];
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  payhere: "PayHere",
  koko: "Koko BNPL",
  mintpay: "MintPay",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
      <div className="text-[12.5px] font-semibold text-[var(--ink-faint)]">{label}</div>
      <div className="mt-1.5 font-display text-[26px] font-extrabold text-[var(--ink)]">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-[var(--ink-dim)]">{sub}</div>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return <div className="text-[13.5px] text-[var(--ink-faint)]">Loading dashboard…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Dashboard</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          Overview of your store&apos;s revenue and activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={money(stats.totalRevenue)} />
        <StatCard label="Total Orders" value={stats.totalOrders.toLocaleString()} />
        <StatCard label="Avg. Order Value" value={money(stats.avgOrderValue)} />
        <StatCard
          label="Revenue (7d)"
          value={money(stats.revenue7d)}
          sub={`${stats.growthPct >= 0 ? "+" : ""}${stats.growthPct.toFixed(1)}% vs prior week`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
          <h3 className="mb-4 text-[14px] font-bold text-[var(--ink)]">Revenue (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.daily}>
              <defs>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4238" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ef4238" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12.5 }}
                formatter={(v) => [money(Number(v)), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#ef4238" strokeWidth={2.5} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
          <h3 className="mb-4 text-[14px] font-bold text-[var(--ink)]">Orders (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12.5 }}
              />
              <Bar dataKey="orders" fill="#00aef0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
          <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">Daily Reports</h3>
          <div className="scrollbar-none max-h-[280px] overflow-y-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="text-[var(--ink-faint)]">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Orders</th>
                  <th className="pb-2 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {[...stats.daily].reverse().map((d) => (
                  <tr key={d.date} className="border-t border-[var(--border)]">
                    <td className="py-2 text-[var(--ink)]">{d.label}</td>
                    <td className="py-2 text-[var(--ink-dim)]">{d.orders}</td>
                    <td className="py-2 text-right font-semibold text-[var(--ink)]">{money(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
            <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">Payment Methods</h3>
            {stats.paymentBreakdown.length === 0 ? (
              <p className="text-[12.5px] text-[var(--ink-faint)]">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats.paymentBreakdown.map((p) => (
                  <div key={p.method} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[var(--ink-dim)]">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                    <span className="font-semibold text-[var(--ink)]">{p.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
            <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">Top Selling Books</h3>
            {stats.topBooks.length === 0 ? (
              <p className="text-[12.5px] text-[var(--ink-faint)]">No sales yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {stats.topBooks.map((b, i) => (
                  <div key={b.title + i} className="flex items-center justify-between text-[12.5px]">
                    <span className="truncate pr-2 text-[var(--ink-dim)]">{b.title}</span>
                    <span className="shrink-0 font-semibold text-[var(--ink)]">{b.qty} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
