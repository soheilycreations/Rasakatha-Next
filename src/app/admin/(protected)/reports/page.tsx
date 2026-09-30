"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { money } from "@/lib/format";

type Bucket = {
  key: string;
  label: string;
  webRevenue: number;
  posRevenue: number;
  webOrders: number;
  posSales: number;
  totalRevenue: number;
};

type ReportData = {
  period: "daily" | "monthly";
  series: Bucket[];
  totals: { webRevenue: number; posRevenue: number; webOrders: number; posSales: number; totalRevenue: number };
  productMovement: { id: string; title: string; qty: number; revenue: number }[];
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
      <div className="text-[12.5px] font-semibold text-[var(--ink-faint)]">{label}</div>
      <div className="mt-1.5 font-display text-[24px] font-extrabold text-[var(--ink)]">{value}</div>
      {sub && <div className="mt-1 text-[12px] text-[var(--ink-dim)]">{sub}</div>}
    </div>
  );
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [data, setData] = useState<ReportData | null>(null);

  useEffect(() => {
    queueMicrotask(() => setData(null));
    fetch(`/api/admin/reports?period=${period}`)
      .then((r) => r.json())
      .then(setData);
  }, [period]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Reports</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">Web orders and in-store sales, combined.</p>
        </div>
        <div className="flex rounded-full bg-[var(--surface-tint)] p-1">
          {(["daily", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold capitalize transition-colors ${
                period === p ? "bg-accent text-white" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading report…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Revenue" value={money(data.totals.totalRevenue)} sub={period === "daily" ? "Last 30 days" : "Last 12 months"} />
            <StatCard label="Web Orders" value={`${data.totals.webOrders}`} sub={money(data.totals.webRevenue)} />
            <StatCard label="Shop Sales" value={`${data.totals.posSales}`} sub={money(data.totals.posRevenue)} />
            <StatCard
              label="Avg. Sale Value"
              value={money(
                data.totals.webOrders + data.totals.posSales > 0
                  ? data.totals.totalRevenue / (data.totals.webOrders + data.totals.posSales)
                  : 0
              )}
            />
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
            <h3 className="mb-4 text-[14px] font-bold text-[var(--ink)]">
              Revenue by Source — {period === "daily" ? "Last 30 Days" : "Last 12 Months"}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--ink-faint)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={period === "daily" ? 3 : 0}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12.5 }}
                  formatter={(v, name) => [money(Number(v)), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12.5 }} />
                <Bar dataKey="webRevenue" name="Web Orders" stackId="rev" fill="#00aef0" radius={[0, 0, 0, 0]} />
                <Bar dataKey="posRevenue" name="Shop Sales" stackId="rev" fill="#ef4238" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
              <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">
                {period === "daily" ? "Daily" : "Monthly"} Report
              </h3>
              <div className="scrollbar-none max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="text-[var(--ink-faint)]">
                      <th className="pb-2 font-semibold">{period === "daily" ? "Date" : "Month"}</th>
                      <th className="pb-2 text-right font-semibold">Web</th>
                      <th className="pb-2 text-right font-semibold">Shop</th>
                      <th className="pb-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.series].reverse().map((b) => (
                      <tr key={b.key} className="border-t border-[var(--border)]">
                        <td className="py-2 text-[var(--ink)]">{b.label}</td>
                        <td className="py-2 text-right text-[var(--ink-dim)]">{money(b.webRevenue)}</td>
                        <td className="py-2 text-right text-[var(--ink-dim)]">{money(b.posRevenue)}</td>
                        <td className="py-2 text-right font-semibold text-[var(--ink)]">{money(b.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
              <h3 className="mb-3 text-[14px] font-bold text-[var(--ink)]">Product Movement — Top Sellers</h3>
              {data.productMovement.length === 0 ? (
                <p className="text-[12.5px] text-[var(--ink-faint)]">No sales in this period yet.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.productMovement.map((p, i) => {
                    const max = data.productMovement[0]?.qty || 1;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="w-4 shrink-0 text-[11px] font-bold text-[var(--ink-faint)]">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{p.title}</span>
                            <span className="shrink-0 text-[12px] font-bold text-[var(--ink-dim)]">{p.qty} sold</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-tint-strong)]">
                            <div className="h-full rounded-full bg-accent" style={{ width: `${(p.qty / max) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
