"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import CatalogGrid from "./CatalogGrid";

export default function LibraryView({ wish }: { wish: Record<string, boolean> }) {
  const ids = Object.keys(wish).filter((id) => wish[id]);
  const idsKey = ids.join(",");
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(ids.length > 0);

  useEffect(() => {
    if (!idsKey) return;
    queueMicrotask(() => setLoading(true));
    fetch(`/api/books?ids=${idsKey}`)
      .then((r) => r.json())
      .then((data: { items: CatalogBook[] }) => {
        setItems(data.items);
        setLoading(false);
      });
  }, [idsKey]);

  const displayItems = ids.length === 0 ? [] : items;
  const displayLoading = ids.length === 0 ? false : loading;

  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-bold text-[var(--ink)]">My Library</h1>
      <CatalogGrid
        items={displayItems}
        loading={displayLoading}
        emptyMessage="You haven't saved any books yet. Tap the ♥ on a book to add it here."
      />
    </div>
  );
}
