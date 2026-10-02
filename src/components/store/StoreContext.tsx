"use client";

import { createContext, useContext } from "react";
import type { CatalogBook } from "@/lib/catalog";
import type { CartItem } from "@/lib/cart";
import type { Account } from "@/lib/account";
import type { Customer, StoredOrder } from "@/lib/orders";

export type StoreState = {
  wish: Record<string, boolean>;
  toggleWish: (id: string) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "qty">) => void;
  addBookToCart: (book: CatalogBook) => void;
  removeFromCart: (id: string) => void;
  changeCartQty: (id: string, delta: number) => void;
  openBook: (book: { id: string; title: string }) => void;
  account: Account | null;
  setAccount: (a: Account | null) => void;
  openAuth: () => void;
  signOut: () => Promise<void>;
  placedOrder: StoredOrder | undefined;
  placeOrder: (payment: string, customer: Customer) => Promise<void>;
  notify: (message: string) => void;
};

export const StoreContext = createContext<StoreState | null>(null);

export function useStore(): StoreState {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreShell>");
  return ctx;
}

// Props every grid/row view takes — saves repeating the four handlers.
export function useCardHandlers() {
  const s = useStore();
  return { wish: s.wish, onToggleWish: s.toggleWish, onAdd: s.addBookToCart, onOpen: s.openBook };
}
