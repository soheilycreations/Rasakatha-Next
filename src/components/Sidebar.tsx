"use client";

import { useState } from "react";
import CoverArt from "./CoverArt";
import { continueReading } from "@/lib/data";
import { IconHome, IconGrid, IconBook, IconHeart, IconX } from "./icons";

const NAV = [
  { label: "Home", icon: IconHome },
  { label: "Categories", icon: IconGrid },
  { label: "Wishlist", icon: IconHeart },
  { label: "My Library", icon: IconBook },
];

export default function Sidebar({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "drawer";
  onNavigate?: () => void;
}) {
  const [active, setActive] = useState("Home");

  return (
    <aside
      className={
        variant === "desktop"
          ? "hidden lg:flex w-[272px] shrink-0 flex-col border-r border-border bg-bg-elevated px-5 py-6"
          : "flex h-full w-[272px] shrink-0 flex-col bg-bg-elevated px-5 py-6"
      }
    >
      <div className="flex items-center gap-2.5 px-1">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink">
          <IconBook className="h-5 w-5" />
        </div>
        <div className="leading-none">
          <p className="font-display text-[1.15rem] font-semibold tracking-tight">Rasakatha</p>
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">රසකථා bookstore</p>
        </div>
        {variant === "drawer" && (
          <button
            onClick={onNavigate}
            aria-label="Close menu"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-ink-dim hover:bg-white/5 hover:text-ink"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="mt-9 flex flex-col gap-1">
        {NAV.map(({ label, icon: Icon }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => {
                setActive(label);
                onNavigate?.();
              }}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-ink-dim hover:bg-white/5 hover:text-ink"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? "text-accent" : "text-ink-faint group-hover:text-ink"}`} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-9">
        <p className="px-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
          Continue Reading
        </p>
        <div className="mt-3 flex flex-col gap-2.5">
          {continueReading.map(({ book, progress }) => (
            <button
              key={book.id}
              className="flex items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/5"
            >
              <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
                <CoverArt cover={book.cover} title={book.title} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.83rem] font-medium text-ink">{book.title}</p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-[0.68rem] text-ink-faint">{progress}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-2xl border border-border bg-bg-card p-3.5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-9 shrink-0 overflow-hidden rounded-md ring-1 ring-white/10">
            <CoverArt cover={continueReading[0].book.cover} title={continueReading[0].book.title} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] font-medium">{continueReading[0].book.title}</p>
            <p className="text-[0.72rem] text-ink-faint">Syncing to your library · {continueReading[0].progress}%</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-rose" style={{ width: `${continueReading[0].progress}%` }} />
        </div>
      </div>
    </aside>
  );
}
