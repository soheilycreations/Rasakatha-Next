export default function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid h-[34px] w-[34px] place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] text-[15px] text-[var(--ink-dim)] transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Previous page"
      >
        ←
      </button>
      <span className="text-xs text-[var(--ink-faint)]">
        Page {page} of {pageCount}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className="grid h-[34px] w-[34px] place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] text-[15px] text-[var(--ink-dim)] transition-colors hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}
