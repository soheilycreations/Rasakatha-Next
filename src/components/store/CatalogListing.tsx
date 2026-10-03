"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CatalogBook } from "@/lib/catalog";
import { categoryHref } from "@/lib/links";
import CatalogGrid from "./CatalogGrid";
import Pager from "./Pager";
import Footer from "./Footer";

type Chip = { name: string; count: number };

const ORDERS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

// Server-rendered first page (good for SEO and instant paint); sorting,
// filtering and further pages are fetched on the client.
export default function CatalogListing({
  title,
  intro,
  query,
  initialItems,
  initialPageCount,
  initialTotal,
  initialGrid,
  chips,
  activeChip,
  header,
  defaultOrder = "recommended",
  defaultInStockOnly = false,
}: {
  title: string;
  intro?: string;
  query: string; // e.g. "category=Novel" — passed to /api/books
  initialItems: CatalogBook[];
  initialPageCount: number;
  initialTotal: number;
  // server-rendered cards for the first page (shown until the visitor changes sort/filter/page)
  initialGrid?: React.ReactNode;
  chips?: Chip[];
  activeChip?: string;
  header?: React.ReactNode;
  defaultOrder?: string;
  defaultInStockOnly?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState(defaultOrder);
  const [inStockOnly, setInStockOnly] = useState(defaultInStockOnly);
  const [fetched, setFetched] = useState<{
    key: string;
    items: CatalogBook[];
    pageCount: number;
    total: number;
  } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const isInitial = page === 1 && order === defaultOrder && inStockOnly === defaultInStockOnly;
  const key = `${query}&page=${page}&limit=24&order=${order}${inStockOnly ? "&instock=1" : ""}`;

  useEffect(() => {
    if (isInitial) return;
    let cancelled = false;
    fetch(`/api/books?${key}`)
      .then((r) => r.json())
      .then((d: { items: CatalogBook[]; pageCount: number; total: number }) => {
        if (!cancelled) setFetched({ key, items: d.items, pageCount: d.pageCount, total: d.total });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, isInitial]);

  const loading = !isInitial && fetched?.key !== key;
  const data = isInitial
    ? { items: initialItems, pageCount: initialPageCount, total: initialTotal }
    : fetched ?? { items: [], pageCount: initialPageCount, total: initialTotal };

  return (
    <div className="pt-4">
      <div ref={topRef} className="scroll-mt-4 px-4 sm:px-8">
        {header}
        <h1 className="font-display text-2xl font-bold text-[var(--ink)] sm:text-[28px]">{title}</h1>
        {intro && <p className="mt-1.5 max-w-2xl text-[13.5px] text-[var(--ink-dim)]">{intro}</p>}

        {chips && chips.length > 0 && (
          <div className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {chips.map((c) => {
              const active = activeChip === c.name;
              return (
                <Link
                  key={c.name}
                  href={categoryHref(c.name)}
                  aria-current={active ? "page" : undefined}
                  className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                  style={{
                    background: active ? "var(--accent-fill)" : "var(--surface-tint)",
                    color: active ? "#fff" : "var(--ink-dim)",
                    border: active ? "1px solid var(--accent-fill)" : "1px solid var(--border)",
                  }}
                >
                  {c.name} <span className="font-normal">({c.count})</span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mb-5 mt-5 flex flex-wrap items-center gap-3 border-b border-[var(--border)] pb-4">
          <span className="text-[13px] text-[var(--ink-faint)]">
            {data.total} book{data.total === 1 ? "" : "s"}
          </span>
          <div className="flex-1" />
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[var(--ink-dim)]">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-[#EF4238]"
            />
            In stock only
          </label>
          <select
            value={order}
            onChange={(e) => {
              setOrder(e.target.value);
              setPage(1);
            }}
            aria-label="Sort books"
            className="rounded-full border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2 text-[13px] text-[var(--ink)] focus:border-accent/50 focus:outline-none"
          >
            {ORDERS.map((o) => (
              <option key={o.value} value={o.value} style={{ color: "#111", background: "#fff" }}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {isInitial && initialGrid ? initialGrid : <CatalogGrid items={data.items} loading={loading} emptyMessage="No books here yet." />}
        <Pager
          page={page}
          pageCount={data.pageCount}
          onChange={(p) => {
            setPage(p);
            topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
