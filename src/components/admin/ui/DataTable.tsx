"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Button from "./Button";
import EmptyState from "./EmptyState";
import { SkeletonRows } from "./Skeleton";
import { fieldClass } from "./Input";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  width?: string; // CSS grid track, default minmax(0,1fr)
  align?: "left" | "right";
  hiddenByDefault?: boolean;
  hideBelow?: "md" | "lg"; // hide on narrow screens
};

// Sortable, filterable table with a column chooser, sticky header and virtual rows (only the visible rows are in
// the DOM, so even 100 rows stay light). Lists are paginated on the server; this component handles one page.
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  filterText,
  filterLabel = "Filter this list",
  loading,
  empty,
  rowHeight = 68,
  maxHeight = "68vh",
  storageKey,
  caption,
  toolbar,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  filterText?: (row: T) => string; // when given, shows a filter box
  filterLabel?: string;
  loading?: boolean;
  empty?: React.ReactNode;
  rowHeight?: number;
  maxHeight?: string;
  storageKey?: string; // remembers the column choice
  caption: string;
  toolbar?: React.ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [filter, setFilter] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.hiddenByDefault).map((c) => c.key)));
  const [chooser, setChooser] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chooserRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(`table:${storageKey}`);
      if (saved) queueMicrotask(() => setHidden(new Set(JSON.parse(saved) as string[])));
    } catch {
      // storage unavailable: keep defaults
    }
  }, [storageKey]);

  useEffect(() => {
    if (!chooser) return;
    const onDown = (e: MouseEvent) => {
      if (chooserRef.current && !chooserRef.current.contains(e.target as Node)) setChooser(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [chooser]);

  const visible = columns.filter((c) => !hidden.has(c.key));

  const data = useMemo(() => {
    let list = rows;
    const q = filter.trim().toLowerCase();
    if (q && filterText) list = list.filter((r) => filterText(r).toLowerCase().includes(q));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const sv = col.sortValue;
        list = [...list].sort((a, b) => {
          const x = sv(a);
          const y = sv(b);
          return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
        });
      }
    }
    return list;
  }, [rows, filter, filterText, sort, columns]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({ count: data.length, getScrollElement: () => scrollRef.current, estimateSize: () => rowHeight, overscan: 8 });

  const template = visible.map((c) => c.width ?? "minmax(0,1fr)").join(" ");
  const toggleColumn = (key: string) => {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setHidden(next);
    if (storageKey) {
      try {
        localStorage.setItem(`table:${storageKey}`, JSON.stringify([...next]));
      } catch {
        // ignore
      }
    }
  };

  if (loading) return <SkeletonRows />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-3">
        {filterText && (
          <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-[12.5px] font-semibold text-[var(--ink-dim)] sm:max-w-xs">
            {filterLabel}
            <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} className={`${fieldClass} border-[var(--border)] font-normal`} />
          </label>
        )}
        <div className="flex-1" />
        {toolbar}
        <div ref={chooserRef} className="relative">
          <Button size="sm" onClick={() => setChooser((o) => !o)} aria-expanded={chooser} aria-haspopup="true">
            Columns
          </Button>
          {chooser && (
            <div role="group" aria-label="Choose columns" className="absolute right-0 z-30 mt-1 w-52 rounded-xl border border-[var(--border)] bg-card p-2 shadow-xl">
              {columns.map((c) => (
                <label key={c.key} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-[13px] text-[var(--ink)] hover:bg-[var(--surface-tint)]">
                  <input type="checkbox" checked={!hidden.has(c.key)} onChange={() => toggleColumn(c.key)} className="accent-accent" />
                  {c.header}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        (empty ?? <EmptyState title="Nothing to show" />)
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <div ref={scrollRef} style={{ maxHeight }} className="overflow-auto" role="table" aria-label={caption} aria-rowcount={data.length}>
            <div role="row" style={{ gridTemplateColumns: template }} className="sticky top-0 z-10 grid min-w-[640px] gap-3 border-b border-[var(--border)] bg-[var(--card-2)] px-4 py-2.5 text-[11.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
              {visible.map((c) => {
                const sorted = sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none";
                return (
                  <div key={c.key} role="columnheader" aria-sort={c.sortValue ? sorted : undefined} className={`${c.align === "right" ? "text-right" : ""} ${c.hideBelow === "md" ? "max-md:hidden" : c.hideBelow === "lg" ? "max-lg:hidden" : ""}`}>
                    {c.sortValue ? (
                      <button
                        type="button"
                        onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}
                        className="inline-flex items-center gap-1 uppercase hover:text-[var(--ink)]"
                      >
                        {c.header}
                        <span aria-hidden>{sorted === "ascending" ? "▲" : sorted === "descending" ? "▼" : ""}</span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ height: virtualizer.getTotalSize(), position: "relative", minWidth: 640 }}>
              {virtualizer.getVirtualItems().map((v) => {
                const row = data[v.index];
                return (
                  <div
                    key={rowKey(row)}
                    role="row"
                    aria-rowindex={v.index + 1}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(row)) : undefined}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: v.size, transform: `translateY(${v.start}px)`, gridTemplateColumns: template }}
                    className={`grid items-center gap-3 border-b border-[var(--border)] px-4 text-[13.5px] text-[var(--ink)] ${onRowClick ? "cursor-pointer hover:bg-[var(--surface-tint)] focus-visible:bg-[var(--surface-tint)]" : ""}`}
                  >
                    {visible.map((c) => (
                      <div key={c.key} role="cell" className={`min-w-0 ${c.align === "right" ? "text-right" : ""} ${c.hideBelow === "md" ? "max-md:hidden" : c.hideBelow === "lg" ? "max-lg:hidden" : ""}`}>
                        {c.cell(row)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
