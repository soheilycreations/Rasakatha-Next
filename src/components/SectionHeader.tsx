import { IconArrow } from "./icons";

export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-dim">{subtitle}</p>}
      </div>
      <button className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        View all <IconArrow className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
