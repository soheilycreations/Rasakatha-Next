import { IconTrendUp, IconTrendDown, IconTrendFlat } from "./icons";

const STYLES = {
  up: { color: "#2f9e5c", bg: "rgba(47,158,92,0.14)", Icon: IconTrendUp },
  down: { color: "#EF4238", bg: "rgba(239,66,56,0.12)", Icon: IconTrendDown },
  flat: { color: "var(--ink-faint)", bg: "var(--surface-tint-strong)", Icon: IconTrendFlat },
} as const;

export default function TrendBadge({
  trend,
  changePct,
  className = "",
}: {
  trend: "up" | "down" | "flat";
  changePct: number;
  className?: string;
}) {
  const { color, bg, Icon } = STYLES[trend];
  const label = trend === "flat" ? "Steady" : `${changePct > 0 ? "+" : ""}${changePct}%`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${className}`}
      style={{ color, background: bg }}
      title={
        trend === "up"
          ? "Selling more than last week"
          : trend === "down"
            ? "Selling less than last week"
            : "About the same as last week"
      }
    >
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}
