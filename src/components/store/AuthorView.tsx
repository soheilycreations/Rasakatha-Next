"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import CatalogGrid from "./CatalogGrid";
import AuthorAvatar from "./AuthorAvatar";
import { IconStar, IconBook } from "./icons";

export default function AuthorView({
  author,
  wish,
  onToggleWish,
  onAdd,
  onOpen,
}: {
  author: string;
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
}) {
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    fetch(`/api/books?author=${encodeURIComponent(author)}&limit=60`)
      .then((r) => r.json())
      .then((data: { items: CatalogBook[] }) => {
        setItems(data.items);
        setLoading(false);
      });
  }, [author]);

  const avgRating =
    items.length > 0 ? items.reduce((s, b) => s + (b.rating || 4), 0) / items.length : 0;

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-4 rounded-[24px] border border-[var(--border)] bg-card px-6 py-10 text-center sm:flex-row sm:text-left">
        <AuthorAvatar name={author} size={84} className="text-2xl" />
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold text-[var(--ink)] sm:text-[28px]">{author}</h3>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px] text-[var(--ink-dim)] sm:justify-start">
            <span className="flex items-center gap-1.5">
              <IconBook className="h-4 w-4 text-accent" />
              {items.length} book{items.length === 1 ? "" : "s"}
            </span>
            {avgRating > 0 && (
              <span className="flex items-center gap-1.5">
                <IconStar className="h-4 w-4" style={{ fill: "#f5b301", color: "#f5b301" }} />
                {avgRating.toFixed(1)} average rating
              </span>
            )}
          </div>
        </div>
      </div>

      <h4 className="font-display mb-4 text-lg font-bold text-[var(--ink)]">Books by {author}</h4>
      <CatalogGrid
        items={items}
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        loading={loading}
      />
    </div>
  );
}
