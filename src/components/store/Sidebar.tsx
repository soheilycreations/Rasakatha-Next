"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BookCover from "./BookCover";
import TrendBadge from "./TrendBadge";
import { tintForId } from "@/lib/format";
import { NAV_ITEMS } from "@/lib/store-data";
import { IconHome, IconCategories, IconLibrary } from "./icons";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";

const NAV_ICONS = {
  Home: IconHome,
  Categories: IconCategories,
  "My Library": IconLibrary,
};

type TrendingBook = {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  qtySold: number;
  trend: "up" | "down" | "flat";
  changePct: number;
};

export default function Sidebar({
  nav,
  onNavSelect,
  onOpenBook,
  variant = "desktop",
}: {
  nav: string;
  onNavSelect: (label: string) => void;
  onOpenBook: (id: string) => void;
  variant?: "desktop" | "drawer";
}) {
  const [trending, setTrending] = useState<TrendingBook[]>([]);
  const [basis, setBasis] = useState<"recent" | "all_time">("recent");

  useEffect(() => {
    fetch("/api/trending-books?limit=10")
      .then((r) => r.json())
      .then((data: { items: TrendingBook[]; basis: "recent" | "all_time" }) => {
        setTrending(data.items);
        setBasis(data.basis);
      });
  }, []);

  return (
    <aside
      className={
        variant === "desktop"
          ? "hidden w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-sidebar px-[18px] pb-[18px] pt-[26px] md:flex"
          : "flex h-full w-[264px] shrink-0 flex-col overflow-y-auto bg-sidebar px-[18px] pb-[18px] pt-[26px]"
      }
    >
      <div className="mb-[26px] flex items-center justify-center">
        <Image
          src={logoLight}
          alt="Rasakatha.lk"
          className="logo-light h-[46px] w-auto"
          priority
        />
        <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-[58px] w-auto" priority />
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((label) => {
          const Icon = NAV_ICONS[label];
          const isActive = nav === label;
          return (
            <button
              key={label}
              onClick={() => onNavSelect(label)}
              className={`relative flex items-center gap-3.5 rounded-[10px] px-3.5 py-2.5 text-left font-sans text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-accent/[0.14] text-[var(--ink)]"
                  : "text-[var(--ink-dim)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <span
                className="grid h-[18px] w-[18px] place-items-center"
                style={{ color: isActive ? "#EF4238" : "var(--ink-faint)" }}
              >
                <Icon />
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mb-3.5 ml-3.5 mt-[30px] flex items-center gap-1.5 text-[10.5px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
        Trending books
        {basis === "recent" && <span className="h-1.5 w-1.5 rounded-full bg-accent" title="Live, based on this week's sales" />}
      </div>
      <div className="scrollbar-none -mx-1 flex min-h-[150px] flex-1 flex-col gap-1 overflow-y-auto">
        {trending.map((book, i) => (
          <button
            key={book.id}
            onClick={() => onOpenBook(book.id)}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-tint)]"
          >
            <span className="w-3.5 shrink-0 text-center text-[11px] font-bold text-[var(--ink-faint)]">{i + 1}</span>
            <BookCover
              cover={book.cover || undefined}
              tint={tintForId(book.id)}
              alt={book.title}
              className="h-[46px] w-[34px] shrink-0 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--ink)]">{book.title}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--ink-faint)]">
                {book.qtySold > 0 ? (
                  <>
                    <span className="truncate">{book.qtySold} sold</span>
                    <TrendBadge trend={book.trend} changePct={book.changePct} />
                  </>
                ) : (
                  <span className="truncate">No sales yet</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
