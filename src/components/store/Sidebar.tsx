"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AuthorAvatar from "./AuthorAvatar";
import type { AuthorSummary } from "@/lib/catalog";
import { NAV_ITEMS } from "@/lib/store-data";
import { IconHome, IconCategories, IconLibrary, IconStar } from "./icons";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";

const NAV_ICONS = {
  Home: IconHome,
  Categories: IconCategories,
  "My Library": IconLibrary,
};

export default function Sidebar({
  nav,
  onNavSelect,
  onSelectAuthor,
  variant = "desktop",
}: {
  nav: string;
  onNavSelect: (label: string) => void;
  onSelectAuthor: (name: string) => void;
  variant?: "desktop" | "drawer";
}) {
  const [authors, setAuthors] = useState<AuthorSummary[]>([]);

  useEffect(() => {
    fetch("/api/authors?limit=20")
      .then((r) => r.json())
      .then((data: AuthorSummary[]) => setAuthors(data));
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

      <div className="mb-3.5 ml-3.5 mt-[30px] text-[10.5px] tracking-[0.18em] text-[var(--ink-faint)] uppercase">
        Top authors
      </div>
      <div className="scrollbar-none -mx-1 flex min-h-[150px] flex-1 flex-col gap-1 overflow-y-auto">
        {authors.map((a) => (
          <button
            key={a.name}
            onClick={() => onSelectAuthor(a.name)}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-tint)]"
          >
            <AuthorAvatar name={a.name} size={38} className="text-[13px]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--ink)]">{a.name}</div>
              <div className="flex items-center gap-2 text-xs text-[var(--ink-faint)]">
                <span>{a.count} books</span>
                <span className="flex items-center gap-0.5">
                  <IconStar className="h-3 w-3" style={{ fill: "#f5b301", color: "#f5b301" }} />
                  {a.avgRating.toFixed(1)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
