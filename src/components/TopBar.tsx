import CoverArt from "./CoverArt";
import { books } from "@/lib/data";
import { IconSearch, IconSliders, IconHeart, IconBag, IconMenu } from "./icons";

export default function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="flex items-center gap-3 px-4 py-5 sm:gap-4 sm:px-6 lg:px-9">
      <button
        onClick={onMenuClick}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-bg-card text-ink-dim lg:hidden"
        aria-label="Open menu"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-bg-card px-4 py-3">
        <IconSearch className="h-[18px] w-[18px] text-ink-faint" />
        <input
          type="text"
          placeholder="Search titles, authors, categories…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-ink-dim hover:text-ink">
          <IconSliders className="h-4 w-4" />
        </button>
      </div>

      <button className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-bg-card text-ink-dim transition-colors hover:text-rose sm:grid">
        <IconHeart className="h-[18px] w-[18px]" />
      </button>

      <button className="relative hidden h-11 w-11 shrink-0 place-items-center rounded-2xl border border-border bg-bg-card text-ink-dim transition-colors hover:text-accent sm:grid">
        <IconBag className="h-[18px] w-[18px]" />
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-[0.65rem] font-semibold text-accent-ink">
          3
        </span>
      </button>

      <button className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-border bg-bg-card py-1.5 pl-1.5 pr-3.5">
        <div className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/10">
          <CoverArt cover={books[2].cover} title="S" className="h-full w-full" />
        </div>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-[0.82rem] font-medium">Soheil</p>
          <p className="text-[0.68rem] text-accent">View profile</p>
        </div>
      </button>
    </header>
  );
}
