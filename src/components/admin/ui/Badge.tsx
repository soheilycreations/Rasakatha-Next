const TONES = {
  neutral: "bg-[var(--surface-tint-strong)] text-[var(--ink-dim)]",
  accent: "bg-accent/15 text-accent",
  success: "bg-emerald-500/15 text-[var(--success-text)]",
  warning: "bg-amber-500/15 text-amber-700 [[data-theme=dark]_&]:text-amber-400",
  info: "bg-sky-500/15 text-accent-blue",
} as const;

export default function Badge({ tone = "neutral", children, className = "" }: { tone?: keyof typeof TONES; children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONES[tone]} ${className}`}>{children}</span>;
}
