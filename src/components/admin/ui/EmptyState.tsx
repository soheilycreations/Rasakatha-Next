export default function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-card p-10 text-center">
      <h3 className="font-display text-lg font-bold text-[var(--ink)]">{title}</h3>
      {children && <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-[var(--ink-dim)]">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
