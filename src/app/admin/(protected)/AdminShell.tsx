"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";
import { ROLE_LABELS, type Permission, type Role } from "@/lib/permissions";
import { Badge, Kbd, ToastProvider, useToast } from "@/components/admin/ui";
import NavIcon from "./NavIcon";
import CommandPalette from "./CommandPalette";
import SwitchUser from "./SwitchUser";

type NavItem = { href: string; label: string; icon: string; perm: Permission };
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "grid", perm: "dashboard.view" }] },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Web Orders", icon: "box", perm: "orders.view" },
      { href: "/admin/pos", label: "Point of Sale", icon: "till", perm: "pos.use" },
      { href: "/admin/pos/sales", label: "Shop Sales", icon: "receipt", perm: "pos.sales.view" },
      { href: "/admin/customers", label: "Customers", icon: "user", perm: "customers.view" },
      { href: "/admin/reports", label: "Reports", icon: "chart", perm: "reports.view" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/books", label: "Books", icon: "book", perm: "books.view" },
      { href: "/admin/authors", label: "Authors", icon: "user", perm: "authors.edit" },
      { href: "/admin/categories", label: "Categories", icon: "tag", perm: "categories.edit" },
      { href: "/admin/reviews", label: "Reviews", icon: "star", perm: "reviews.moderate" },
      { href: "/admin/sliders", label: "Hero Sliders", icon: "image", perm: "sliders.edit" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/staff", label: "Staff", icon: "shield", perm: "staff.manage" },
      { href: "/admin/audit", label: "Audit log", icon: "log", perm: "audit.view" },
      { href: "/admin/settings", label: "Settings", icon: "cog", perm: "settings.view" },
    ],
  },
];

export type AdminUser = { id: string; name: string; role: Role; emergency: boolean };

function DeniedNotice() {
  const { toast } = useToast();
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("denied")) {
      toast("You don't have access to that page.", { tone: "error" });
      history.replaceState(null, "", window.location.pathname);
    }
  }, [toast]);
  return null;
}

function Shell({ user, permissions, children }: { user: AdminUser; permissions: Permission[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const allowed = new Set<Permission>(permissions);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-sidebar px-4 py-6">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <Image src={logoLight} alt="Rasakatha.lk" className="logo-light h-8 w-auto" priority />
          <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-9 w-auto" priority />
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Admin Panel</div>
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mb-5 flex min-h-11 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3 text-left text-[13px] text-[var(--ink-dim)] transition-colors hover:border-[var(--border-strong)]"
        >
          <NavIcon name="search" className="h-4 w-4 shrink-0" />
          <span className="flex-1">Search or jump to…</span>
          <span className="flex gap-1">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <nav aria-label="Admin" className="flex flex-1 flex-col gap-5">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((i) => allowed.has(i.perm));
            if (items.length === 0) return null;
            return (
              <div key={group.label}>
                <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">{group.label}</div>
                <div className="flex flex-col gap-1">
                  {items.map((item) => {
                    const active = item.href === "/admin" || item.href === "/admin/pos" ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13.5px] font-semibold transition-colors ${
                          active ? "bg-accent/[0.12] text-accent" : "text-[var(--ink-dim)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]"
                        }`}
                      >
                        <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-[var(--border)] pt-4">
          <div className="mb-1 px-3">
            <div className="truncate text-[13px] font-bold text-[var(--ink)]">{user.name}</div>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge tone={user.role === "owner" ? "accent" : "neutral"}>{ROLE_LABELS[user.role]}</Badge>
              {user.emergency && <Badge tone="warning">Emergency login</Badge>}
            </div>
          </div>
          <Link href="/admin/account" className="flex min-h-11 items-center rounded-xl px-3 text-[13px] font-semibold text-[var(--ink-dim)] transition-colors hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]">
            My account &amp; security
          </Link>
          {!user.emergency && (
            <button onClick={() => setSwitching(true)} className="flex min-h-11 items-center rounded-xl px-3 text-left text-[13px] font-semibold text-[var(--ink-dim)] transition-colors hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]">
              Switch user (PIN)
            </button>
          )}
          <Link href="/" className="flex min-h-11 items-center rounded-xl px-3 text-[13px] font-semibold text-[var(--ink-dim)] transition-colors hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]">
            ← Back to Store
          </Link>
          <button onClick={handleLogout} className="flex min-h-11 items-center rounded-xl px-3 text-left text-[13px] font-semibold text-[var(--ink-faint)] transition-colors hover:bg-accent/[0.08] hover:text-accent">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-7">{children}</main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} permissions={permissions} />
      <SwitchUser open={switching} onClose={() => setSwitching(false)} />
      <DeniedNotice />
    </div>
  );
}

export default function AdminShell(props: { user: AdminUser; permissions: Permission[]; children: React.ReactNode }) {
  return (
    <ToastProvider>
      <Shell {...props} />
    </ToastProvider>
  );
}
