export default function Loading() {
  return (
    <div className="animate-pulse px-4 py-6 sm:px-8" aria-busy="true" aria-label="Loading book">
      <div className="mb-6 h-3 w-48 rounded bg-[var(--surface-tint)]" />
      <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
        <div className="aspect-[2/3] w-full rounded-2xl bg-[var(--surface-tint)]" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-[var(--surface-tint)]" />
          <div className="h-4 w-1/3 rounded bg-[var(--surface-tint)]" />
          <div className="h-7 w-32 rounded bg-[var(--surface-tint)]" />
          <div className="h-12 w-56 rounded-full bg-[var(--surface-tint)]" />
          <div className="space-y-2 pt-4">
            <div className="h-3 w-full rounded bg-[var(--surface-tint)]" />
            <div className="h-3 w-full rounded bg-[var(--surface-tint)]" />
            <div className="h-3 w-2/3 rounded bg-[var(--surface-tint)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
