import EmptyState from "./EmptyState";

// Wrapper for every chart: a title, what the numbers are based on, and an empty state.
export default function ChartCard({
  title,
  basedOn,
  empty,
  emptyText = "Not enough data yet.",
  children,
}: {
  title: string;
  basedOn?: string;
  empty?: boolean;
  emptyText?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-card p-5">
      <h3 className="text-[15px] font-bold text-[var(--ink)]">{title}</h3>
      {basedOn && <p className="mt-0.5 text-[12px] text-[var(--ink-faint)]">Based on {basedOn}</p>}
      <div className="mt-4">{empty ? <EmptyState title={emptyText} /> : children}</div>
    </section>
  );
}
