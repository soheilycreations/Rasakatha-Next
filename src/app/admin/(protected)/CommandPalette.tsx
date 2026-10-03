"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Kbd } from "@/components/admin/ui";
import { useFocusTrap } from "@/components/admin/ui/useFocusTrap";
import type { Permission } from "@/lib/permissions";
import NavIcon from "./NavIcon";

type Item = { id: string; group: string; label: string; hint?: string; href: string; icon: string };
type Remote = {
  books: { id: string; title: string; author: string; isbn: string | null; inStock: boolean }[];
  orders: { id: string; name: string; phone: string; total: number; status: string }[];
  customers: { name: string; phone: string }[];
};

const PAGES: (Item & { perm: Permission })[] = [
  { id: "p-dash", group: "Pages", label: "Dashboard", href: "/admin", icon: "grid", perm: "dashboard.view" },
  { id: "p-orders", group: "Pages", label: "Web orders", href: "/admin/orders", icon: "box", perm: "orders.view" },
  { id: "p-pos", group: "Pages", label: "Point of sale", href: "/admin/pos", icon: "till", perm: "pos.use" },
  { id: "p-sales", group: "Pages", label: "Shop sales", href: "/admin/pos/sales", icon: "receipt", perm: "pos.sales.view" },
  { id: "p-cust", group: "Pages", label: "Customers", href: "/admin/customers", icon: "user", perm: "customers.view" },
  { id: "p-rep", group: "Pages", label: "Reports", href: "/admin/reports", icon: "chart", perm: "reports.view" },
  { id: "p-books", group: "Pages", label: "Books", href: "/admin/books", icon: "book", perm: "books.view" },
  { id: "p-auth", group: "Pages", label: "Authors", href: "/admin/authors", icon: "user", perm: "authors.edit" },
  { id: "p-cat", group: "Pages", label: "Categories", href: "/admin/categories", icon: "tag", perm: "categories.edit" },
  { id: "p-rev", group: "Pages", label: "Reviews", href: "/admin/reviews", icon: "star", perm: "reviews.moderate" },
  { id: "p-slide", group: "Pages", label: "Hero sliders", href: "/admin/sliders", icon: "image", perm: "sliders.edit" },
  { id: "p-staff", group: "Pages", label: "Staff", href: "/admin/staff", icon: "shield", perm: "staff.manage" },
  { id: "p-audit", group: "Pages", label: "Audit log", href: "/admin/audit", icon: "log", perm: "audit.view" },
  { id: "p-set", group: "Pages", label: "Settings", href: "/admin/settings", icon: "cog", perm: "settings.view" },
  { id: "p-acct", group: "Pages", label: "My account & security", href: "/admin/account", icon: "shield", perm: "search.use" },
];
const ACTIONS: (Item & { perm: Permission })[] = [
  { id: "a-sale", group: "Quick actions", label: "New sale", hint: "Open the till", href: "/admin/pos", icon: "till", perm: "pos.use" },
  { id: "a-receive", group: "Quick actions", label: "Receive stock", hint: "Goods-received form arrives in Phase 1: opens Books for now", href: "/admin/books", icon: "box", perm: "books.edit" },
  { id: "a-newbook", group: "Quick actions", label: "Add a book", href: "/admin/books?new=1", icon: "book", perm: "books.edit" },
];

// Ctrl+K: jump to any page, book (title / ISBN), order or customer, or run a quick action.
export default function CommandPalette({ open, onClose, permissions }: { open: boolean; onClose: () => void; permissions: Permission[] }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState<Remote | null>(null);
  useFocusTrap(ref, open, onClose);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setQ("");
      setRemote(null);
      setActive(0);
    });
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      queueMicrotask(() => setRemote(null));
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Remote | null) => {
          setRemote(d);
          setActive(0);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const items = useMemo<Item[]>(() => {
    const allowed = new Set(permissions);
    const needle = q.trim().toLowerCase();
    const match = (i: Item) => !needle || `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(needle);
    const out: Item[] = [...ACTIONS.filter((a) => allowed.has(a.perm)).filter(match), ...PAGES.filter((p) => allowed.has(p.perm)).filter(match)];
    if (remote) {
      remote.books.forEach((b) => out.push({ id: `b-${b.id}`, group: "Books", label: b.title, hint: `${b.author}${b.isbn ? ` · ISBN ${b.isbn}` : ""} · #${b.id}${b.inStock ? "" : " · out of stock"}`, href: `/admin/books?q=${encodeURIComponent(b.id)}`, icon: "book" }));
      remote.orders.forEach((o) => out.push({ id: `o-${o.id}`, group: "Orders", label: `Order #${o.id}`, hint: `${o.name} · ${o.phone} · ${o.status}`, href: `/admin/orders?open=${encodeURIComponent(o.id)}`, icon: "box" }));
      remote.customers.forEach((c) => out.push({ id: `c-${c.phone}-${c.name}`, group: "Customers", label: c.name || c.phone, hint: c.phone, href: `/admin/customers?q=${encodeURIComponent(c.phone || c.name)}`, icon: "user" }));
    }
    return out.slice(0, 40);
  }, [q, remote, permissions]);

  if (!open) return null;

  const go = (i: Item | undefined) => {
    if (!i) return;
    onClose();
    router.push(i.href);
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[80] grid place-items-start justify-items-center bg-black/60 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-card shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <NavIcon name="search" className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" />
          <input
            data-autofocus
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined}
            aria-label="Search pages, books, orders, customers"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, items.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(items[active]);
              }
            }}
            placeholder="Search a book, ISBN, order, customer, or type a page name…"
            className="field-bare min-h-14 flex-1 bg-transparent text-[14.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-[var(--ink-dim)]">Nothing found.</li>}
          {items.map((i, idx) => {
            const header = i.group !== lastGroup ? i.group : null;
            lastGroup = i.group;
            return (
              <li key={i.id} role="presentation">
                {header && <div className="px-3 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{header}</div>}
                <div
                  id={`palette-${i.id}`}
                  role="option"
                  aria-selected={idx === active}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => go(i)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-[13.5px] ${idx === active ? "bg-[var(--surface-tint-strong)]" : ""}`}
                >
                  <NavIcon name={i.icon} className="h-4 w-4 shrink-0 text-[var(--ink-faint)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[var(--ink)]">{i.label}</span>
                    {i.hint && <span className="block truncate text-[12px] text-[var(--ink-dim)]">{i.hint}</span>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-[var(--border)] px-4 py-2 text-[11.5px] text-[var(--ink-faint)]">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move
          </span>
          <span>
            <Kbd>Enter</Kbd> to open
          </span>
        </div>
      </div>
    </div>
  );
}
