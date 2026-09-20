"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import CatalogGrid from "./CatalogGrid";

export default function LibraryView({
  wish,
  onToggleWish,
  onAdd,
  onOpen,
}: {
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
}) {
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
      <h3 className="font-display mb-4 text-xl font-bold text-[var(--ink)]">My Library</h3>
      <CatalogGrid
        items={displayItems}
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        loading={displayLoading}
        emptyMessage="You haven't saved any books yet. Tap the ♥ on a book to add it here."
      />
    </div>
  );
}
