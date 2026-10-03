export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-[var(--surface-tint-strong)] ${className}`} />;
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
          <Skeleton className="h-12 w-9" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
