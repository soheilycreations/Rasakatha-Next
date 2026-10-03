// A keyboard-shortcut hint, e.g. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
export default function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-[var(--border-strong)] bg-[var(--surface-tint)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink-dim)]">
      {children}
    </kbd>
  );
}
