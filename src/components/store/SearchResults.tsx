"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import CatalogGrid from "./CatalogGrid";
import Pager from "./Pager";

export default function SearchResults({
  query,
  wish,
  onToggleWish,
  onAdd,
  onOpen,
}: {
  query: string;
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
}) {
  const [prevQuery, setPrevQuery] = useState(query);
  const [page, setPage] = useState(1);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setPage(1);
  }

  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      fetch(`/api/books?search=${encodeURIComponent(query)}&page=${page}&limit=24`)
        .then((r) => r.json())
        .then((data: { items: CatalogBook[]; pageCount: number; total: number }) => {
          setItems(data.items);
          setPageCount(data.pageCount);
          setTotal(data.total);
          setLoading(false);
        });
    }, 200);
    return () => clearTimeout(id);
  }, [query, page]);

  return (
    <div ref={topRef}>
      <h3 className="font-display mb-4 text-xl font-bold text-[var(--ink)]">
        Search results for &ldquo;{query}&rdquo;
        {!loading && <span className="ml-2 text-sm font-normal text-[var(--ink-faint)]">{total} found</span>}
      </h3>
      <CatalogGrid
        items={items}
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        loading={loading}
        emptyMessage="No books match that search."
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
