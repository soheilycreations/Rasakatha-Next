import type { CatalogBook } from "@/lib/catalog";
import CatalogCard from "./CatalogCard";

export default function CatalogGrid({
  items,
  wish,
  onToggleWish,
  onAdd,
  onOpen,
  loading,
  emptyMessage,
}: {
  items: CatalogBook[];
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-[22px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-[18px] border border-[var(--border)] bg-card p-3 pb-4">
            <div className="aspect-[2/3] rounded-xl bg-[var(--surface-tint-strong)]" />
            <div className="mt-4 h-3 w-2/3 rounded bg-[var(--surface-tint-strong)]" />
            <div className="mt-2 h-3 w-1/2 rounded bg-[var(--surface-tint)]" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-11 text-center text-[13.5px] text-[var(--ink-faint)]">
        {emptyMessage || "No books to show."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-[22px]">
      {items.map((book) => (
        <CatalogCard
          key={book.id}
          book={book}
          wished={!!wish[book.id]}
          onToggleWish={onToggleWish}
          onAdd={onAdd}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
