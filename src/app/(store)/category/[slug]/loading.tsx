export default function Loading() {
  return (
    <div className="animate-pulse px-4 py-6 sm:px-8" aria-busy="true" aria-label="Loading category">
      <div className="mb-2 h-8 w-56 rounded bg-[var(--surface-tint)]" />
      <div className="mb-6 h-3 w-32 rounded bg-[var(--surface-tint)]" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] rounded-xl bg-[var(--surface-tint)]" />
            <div className="mt-2 h-3 w-4/5 rounded bg-[var(--surface-tint)]" />
            <div className="mt-1.5 h-3 w-1/3 rounded bg-[var(--surface-tint)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
