import { categories } from "@/lib/data";
import { IconBook, IconFeather, IconBolt, IconMask, IconStar, IconHeart } from "./icons";

const ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  book: IconBook,
  feather: IconFeather,
  bolt: IconBolt,
  mask: IconMask,
  star: IconStar,
  heart: IconHeart,
};

export default function Categories() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((c) => {
        const Icon = ICONS[c.icon] ?? IconBook;
        return (
          <button
            key={c.name}
            className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-bg-card p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent-soft/40"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-accent">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{c.name}</p>
              <p className="text-xs text-ink-faint">{c.count} titles</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
