"use client";

import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/lib/cart";
import type { Account } from "@/lib/account";
import { IconSearch, IconCart, IconHeart } from "./icons";
import ThemeToggle from "./ThemeToggle";
import CartPopover from "./CartPopover";

export default function TopBar({
  query,
  onQueryChange,
  cartItems,
  onRemoveFromCart,
  onChangeCartQty,
  onViewCart,
  onCheckout,
  wishCount,
  onOpenLibrary,
  onMenuClick,
  account,
  onProfileClick,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  cartItems: CartItem[];
  onRemoveFromCart: (id: string) => void;
  onChangeCartQty: (id: string, delta: number) => void;
  onViewCart: () => void;
  onCheckout: () => void;
  wishCount: number;
  onOpenLibrary: () => void;
  onMenuClick: () => void;
  account: Account | null;
  onProfileClick: () => void;
}) {
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const cartCount = cartItems.reduce((sum, x) => sum + x.qty, 0);

  useEffect(() => {
    if (!cartOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) setCartOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [cartOpen]);

  return (
    <header className="relative z-30 flex items-center sm:gap-4 border-b border-[var(--border)] gap-2.5 px-4 pb-3 pt-4 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.25)] sm:px-8 sm:pb-4 sm:pt-6">
      <button
        onClick={onMenuClick}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] text-[var(--ink-dim)] md:hidden"
        aria-label="Open menu"
      >
        <div className="flex flex-col gap-[3px]">
          <span className="h-[1.5px] w-4 bg-current" />
          <span className="h-[1.5px] w-4 bg-current" />
          <span className="h-[1.5px] w-4 bg-current" />
        </div>
      </button>

      <div className="flex min-w-0 max-w-[640px] flex-[3] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-tint)] py-[7px] pl-[18px] pr-[7px] backdrop-blur-md transition-colors focus-within:border-accent/50 focus-within:bg-[var(--surface-tint-strong)]">
        <IconSearch className="shrink-0 text-[var(--ink-faint)]" />
        <input
          type="search"
          enterKeyHint="search"
          aria-label="Search books and authors"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onQueryChange("");
          }}
          placeholder="Search books, authors…"
          className="min-w-0 flex-1 bg-transparent py-1 font-sans text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none sm:text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[var(--surface-tint-strong)] text-[15px] leading-none text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex-1" />

      <div className="hidden sm:block">
        <ThemeToggle />
      </div>

      <button
        onClick={onOpenLibrary}
        className="relative hidden h-[42px] w-[42px] rounded-[14px] border border-[var(--border)] bg-[var(--surface-tint)] text-[var(--ink-dim)] transition-colors hover:border-accent/40 hover:text-accent sm:grid sm:place-items-center"
        aria-label="My Library"
      >
        <IconHeart className="h-[19px] w-[19px]" />
        {wishCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-panel bg-accent px-1 text-[11px] font-bold text-white">
            {wishCount}
          </span>
        )}
      </button>
      <div ref={cartRef} className="relative">
        <button
          onClick={() => setCartOpen((v) => !v)}
          className="relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] border border-[var(--border)] bg-[var(--surface-tint)] text-[var(--ink-dim)] transition-colors hover:border-accent/40"
          aria-label="Cart"
        >
          <IconCart />
          {cartCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-[19px] min-w-[19px] place-items-center rounded-full border-2 border-panel bg-accent px-1 text-[11px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>
        {cartOpen && (
          <CartPopover
            items={cartItems}
            onRemove={onRemoveFromCart}
            onChangeQty={onChangeCartQty}
            onClose={() => setCartOpen(false)}
            onViewCart={onViewCart}
            onCheckout={onCheckout}
          />
        )}
      </div>
      <button
        onClick={onProfileClick}
        className="flex shrink-0 cursor-pointer items-center gap-[11px] rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] py-1.5 pl-[7px] pr-2 text-left transition-colors hover:border-[var(--border-strong)] sm:pr-4"
        aria-label={account ? "View profile" : "Sign in"}
      >
        <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[12.5px] font-bold text-white">
          {account ? (account.name || account.email).slice(0, 2).toUpperCase() : "?"}
        </div>
        <div className="hidden sm:block">
          <div className="max-w-[110px] truncate text-sm font-semibold leading-tight text-[var(--ink)]">
            {account ? account.name || "My account" : "Guest"}
          </div>
          <div className="text-xs text-accent-blue">{account ? "View profile" : "Sign in"}</div>
        </div>
      </button>
    </header>
  );
}
