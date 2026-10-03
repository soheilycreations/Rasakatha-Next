import Skeleton from "./Skeleton";

// A KPI tile. `delta` is the change versus the previous period, in percent.
export default function StatCard({ label, value, hint, delta, loading }: { label: string; value: React.ReactNode; hint?: string; delta?: number | null; loading?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-card p-5">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">{label}</div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <div className="mt-1.5 font-display text-[28px] font-bold leading-tight text-[var(--ink)]">{value}</div>
      )}
      <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--ink-faint)]">
        {delta != null && Number.isFinite(delta) && (
          <span className={delta >= 0 ? "font-bold text-[var(--success-text)]" : "font-bold text-accent"}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint}
      </div>
    </div>
  );
}
