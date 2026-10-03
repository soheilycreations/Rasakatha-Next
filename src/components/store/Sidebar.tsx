"use client";

import Image from "next/image";
import Link from "next/link";
import { bookHref } from "@/lib/links";
import BookCover from "./BookCover";
import ThemeToggle from "./ThemeToggle";
import { tintForId } from "@/lib/format";
import { NAV_ITEMS } from "@/lib/store-data";
import { IconHome, IconCategories, IconLibrary } from "./icons";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";

const NAV_HREFS = {
  Home: "/",
  Categories: "/categories",
  "My Library": "/library",
};

const NAV_ICONS = {
  Home: IconHome,
  Categories: IconCategories,
  "My Library": IconLibrary,
};

import type { Trending } from "@/lib/server/trending";

export default function Sidebar({
  nav,
  trending: { items: trending, basis },
  onNavSelect,
  onOpenBook,
  variant = "desktop",
}: {
  nav: string;
  // rendered on the server (refreshed every 5 minutes), no client fetch
  trending: Trending;
  onNavSelect: (label: string) => void;
  onOpenBook: (book: { id: string; title: string }) => void;
  variant?: "desktop" | "drawer";
}) {
  return (
    <aside
      className={
        variant === "desktop"
          ? "hidden w-[264px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-sidebar px-[18px] pb-[18px] pt-[26px] md:flex"
          : "flex h-full w-[264px] shrink-0 flex-col overflow-y-auto bg-sidebar px-[18px] pb-[18px] pt-[26px]"
      }
    >
      <Link href="/" aria-label="Rasakatha.lk home" className="mb-[26px] flex items-center justify-center">
        <Image
          src={logoLight}
          alt="Rasakatha.lk"
          sizes="200px"
          className="logo-light h-[46px] w-auto"
          priority
        />
        <Image src={logoDark} alt="Rasakatha.lk" sizes="200px" className="logo-dark h-[58px] w-auto" priority />
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((label) => {
          const Icon = NAV_ICONS[label];
          const isActive = nav === label;
          return (
            <Link
              key={label}
              href={NAV_HREFS[label]}
              onClick={(e) => {
                e.preventDefault();
                onNavSelect(label);
              }}
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
                style={{ color: isActive ? "var(--accent)" : "var(--ink-faint)" }}
              >
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {variant === "drawer" && (
        <div className="mt-4 flex items-center gap-3 px-3.5 text-sm font-semibold text-[var(--ink-dim)]">
          <ThemeToggle />
          Light / dark mode
        </div>
      )}

      <div className="mb-3.5 ml-3.5 mt-[30px] flex items-center gap-1.5 text-[10.5px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
        Trending books
        {basis === "recent" && <span className="h-1.5 w-1.5 rounded-full bg-accent" title="Live, based on this week's sales" />}
      </div>
      <div className="scrollbar-none -mx-1 flex min-h-[150px] flex-1 flex-col gap-1 overflow-y-auto">
        {trending.map((book, i) => (
          <Link
            key={book.id}
            href={bookHref(book)}
            onClick={(e) => {
              e.preventDefault();
              onOpenBook(book);
            }}
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
              {/* Sales counts stay private: show the author instead of "2 sold" / "No sales yet". */}
              <div className="mt-0.5 truncate text-xs text-[var(--ink-faint)]">{book.author}</div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
