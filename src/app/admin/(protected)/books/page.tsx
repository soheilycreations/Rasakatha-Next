"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money } from "@/lib/format";

const emptyForm: Partial<CatalogBook> = {
  title: "",
  author: "",
  publisher: "",
  category: "",
  regularPrice: 0,
  salePrice: null,
  onSale: false,
  inStock: true,
  rating: 0,
  blurb: "",
  cover: "",
  weight: 303,
};

function BookForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Partial<CatalogBook>;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<CatalogBook>>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;

  const set = <K extends keyof CatalogBook>(key: K, value: CatalogBook[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50";

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/books", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-[16px] font-bold text-[var(--ink)]">{isEdit ? "Edit Book" : "Add Book"}</h3>
        <div className="grid gap-3">
          <input className={inputClass} placeholder="Title" value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
          <input className={inputClass} placeholder="Author" value={form.author || ""} onChange={(e) => set("author", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Publisher" value={form.publisher || ""} onChange={(e) => set("publisher", e.target.value)} />
            <input className={inputClass} placeholder="Category" value={form.category || ""} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              className={inputClass}
              type="number"
              placeholder="Regular Price"
              value={form.regularPrice ?? 0}
              onChange={(e) => set("regularPrice", Number(e.target.value))}
            />
            <input
              className={inputClass}
              type="number"
              placeholder="Sale Price"
              value={form.salePrice ?? ""}
              onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : null)}
            />
            <input
              className={inputClass}
              type="number"
              placeholder="Weight (g)"
              value={form.weight ?? 303}
              onChange={(e) => set("weight", Number(e.target.value))}
            />
          </div>
          <input className={inputClass} placeholder="Cover image URL" value={form.cover || ""} onChange={(e) => set("cover", e.target.value)} />
          <textarea
            className={`${inputClass} resize-none`}
            placeholder="Blurb"
            rows={3}
            value={form.blurb || ""}
            onChange={(e) => set("blurb", e.target.value)}
          />
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-[13px] text-[var(--ink-dim)]">
              <input type="checkbox" checked={!!form.onSale} onChange={(e) => set("onSale", e.target.checked)} className="accent-accent" />
              On Sale
            </label>
            <label className="flex items-center gap-2 text-[13px] text-[var(--ink-dim)]">
              <input type="checkbox" checked={form.inStock !== false} onChange={(e) => set("inStock", e.target.checked)} className="accent-accent" />
              In Stock
            </label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-accent rounded-full px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBooksPage() {
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CatalogBook> | null>(null);

  const load = () => {
    const params = new URLSearchParams({ page: String(page), limit: "20", search });
    fetch(`/api/admin/books?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setPageCount(data.pageCount);
        setLoading(false);
      });
  };

  useEffect(() => {
    queueMicrotask(() => setLoading(true));
    load();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/admin/books?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Books</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">{total.toLocaleString()} books in your catalog.</p>
        </div>
        <button onClick={() => setEditing(emptyForm)} className="btn-accent rounded-full px-5 py-2.5 text-[13px] font-bold text-white">
          + Add Book
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        placeholder="Search by title, author, or ID…"
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50"
      />

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-faint)]">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--surface-tint)]">
                  <td className="max-w-[240px] truncate px-4 py-3 font-semibold text-[var(--ink)]">{b.title}</td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{b.author}</td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{b.category}</td>
                  <td className="px-4 py-3 text-[var(--ink)]">
                    {b.onSale && b.salePrice ? money(b.salePrice) : money(b.regularPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.inStock ? "bg-[#2f5a3a]/20 text-[#3f8a53]" : "bg-accent/15 text-accent"}`}>
                      {b.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(b)} className="mr-3 text-[12px] font-semibold text-accent-blue hover:opacity-75">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-[12px] font-semibold text-accent hover:opacity-75">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-[13px] text-[var(--ink-dim)]">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full px-3 py-1.5 hover:bg-[var(--surface-tint)] disabled:opacity-40">
            ← Prev
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="rounded-full px-3 py-1.5 hover:bg-[var(--surface-tint)] disabled:opacity-40">
            Next →
          </button>
        </div>
      )}

      {editing && (
        <BookForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
