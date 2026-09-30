"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "grid" }],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Web Orders", icon: "box" },
      { href: "/admin/pos", label: "Point of Sale", icon: "till" },
      { href: "/admin/pos/sales", label: "Shop Sales", icon: "receipt" },
      { href: "/admin/reports", label: "Reports", icon: "chart" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/books", label: "Books", icon: "book" },
      { href: "/admin/authors", label: "Authors", icon: "user" },
      { href: "/admin/categories", label: "Categories", icon: "tag" },
      { href: "/admin/sliders", label: "Hero Sliders", icon: "image" },
    ],
  },
] as const;

function NavIcon({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    box: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
    till: (
      <>
        <rect x="2.5" y="9" width="19" height="12" rx="2" />
        <path d="M6 9V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
        <path d="M2.5 14h19" />
        <circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 2h12v19l-2.5-1.5L13 21l-1-1.5L11 21l-2.5-1.5L6 21z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M12 20V4M20 20v-7" />
        <path d="M2 20h20" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </>
    ),
    tag: (
      <>
        <path d="M20.6 12.9 11.1 3.4a2 2 0 0 0-1.4-.6H4a1 1 0 0 0-1 1v5.7c0 .5.2 1 .6 1.4l9.5 9.5a2 2 0 0 0 2.8 0l4.7-4.7a2 2 0 0 0 0-2.8z" />
        <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-sidebar px-4 py-6">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <Image src={logoLight} alt="Rasakatha.lk" className="logo-light h-8 w-auto" priority />
          <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-9 w-auto" priority />
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">Admin Panel</div>
        </div>

        <nav className="flex flex-1 flex-col gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
                {group.label}
              </div>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active =
                    item.href === "/admin" || item.href === "/admin/pos"
                      ? pathname === item.href
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                        active
                          ? "bg-accent/[0.12] text-accent"
                          : "text-[var(--ink-dim)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]"
                      }`}
                    >
                      <NavIcon name={item.icon} className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-[var(--border)] pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[var(--ink-dim)] transition-colors hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]"
          >
            ← Back to Store
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--ink-faint)] transition-colors hover:bg-accent/[0.08] hover:text-accent"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-7">{children}</main>
    </div>
  );
}
