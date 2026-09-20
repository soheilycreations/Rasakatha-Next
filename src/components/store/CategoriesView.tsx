"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import CatalogGrid from "./CatalogGrid";
import Pager from "./Pager";

type Category = { name: string; count: number };

export default function CategoriesView({
  wish,
  onToggleWish,
  onAdd,
  onOpen,
  initialCategory,
}: {
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
  initialCategory?: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [active, setActive] = useState<string | null>(initialCategory ?? null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0 && !initialCategory) setActive(data[0].name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!active) return;
    queueMicrotask(() => setLoading(true));
    fetch(`/api/books?category=${encodeURIComponent(active)}&page=${page}&limit=24`)
      .then((r) => r.json())
      .then((data: { items: CatalogBook[]; pageCount: number }) => {
        setItems(data.items);
        setPageCount(data.pageCount);
        setLoading(false);
      });
  }, [active, page]);

  return (
    <div ref={topRef}>
      <h3 className="font-display mb-4 text-xl font-bold text-[var(--ink)]">Categories</h3>

      <div className="-mx-1 mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => {
              setActive(c.name);
              setPage(1);
            }}
            className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
            style={{
              background: active === c.name ? "#EF4238" : "var(--surface-tint)",
              color: active === c.name ? "#fff" : "var(--ink-dim)",
              border: active === c.name ? "1px solid #EF4238" : "1px solid var(--border)",
            }}
          >
            {c.name} <span className="opacity-60">({c.count})</span>
          </button>
        ))}
      </div>

      <CatalogGrid
        items={items}
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        loading={loading}
      />
      <Pager
        page={page}
        pageCount={pageCount}
        onChange={(p) => {
          setPage(p);
          topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </div>
  );
}
