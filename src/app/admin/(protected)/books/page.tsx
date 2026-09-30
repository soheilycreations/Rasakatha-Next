"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money } from "@/lib/format";
import ConfirmModal from "../ConfirmModal";
import Toast from "../Toast";

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
  categories,
  authors,
  publishers,
  onCancel,
  onSaved,
}: {
  initial: Partial<CatalogBook>;
  categories: string[];
  authors: string[];
  publishers: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<CatalogBook>>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial.id;

  const set = <K extends keyof CatalogBook>(key: K, value: CatalogBook[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("idHint", form.id || form.title || "");
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not upload that image.");
        return;
      }
      set("cover", data.url);
    } catch {
      setError("Network error while uploading — try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/books", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not save this book. Try again.");
        return;
      }
      onSaved();
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setSaving(false);
    }
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
          <input
            className={inputClass}
            list="author-options"
            placeholder="Author"
            value={form.author || ""}
            onChange={(e) => set("author", e.target.value)}
          />
          <datalist id="author-options">
            {authors.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputClass}
              list="publisher-options"
              placeholder="Publisher"
              value={form.publisher || ""}
              onChange={(e) => set("publisher", e.target.value)}
            />
            <datalist id="publisher-options">
              {publishers.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <input
              className={inputClass}
              list="category-options"
              placeholder="Category"
              value={form.category || ""}
              onChange={(e) => set("category", e.target.value)}
            />
            <datalist id="category-options">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
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
          <div>
            <div className="mb-1.5 text-[11.5px] font-semibold text-[var(--ink-dim)]">Cover Image</div>
            <div className="flex items-center gap-3">
              {form.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.cover} alt="" className="h-20 w-14 shrink-0 rounded-md border border-[var(--border)] object-cover" />
              ) : (
                <div className="grid h-20 w-14 shrink-0 place-items-center rounded-md border border-dashed border-[var(--border-strong)] text-[9px] text-[var(--ink-faint)]">
                  No cover
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2">
                <label className="w-fit cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-tint-strong)]">
                  {uploading ? "Uploading…" : form.cover ? "Replace Image" : "Upload Image"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={handleFileSelect} />
                </label>
                <input
                  className={`${inputClass} text-[12px]`}
                  placeholder="…or paste an image URL"
                  value={form.cover || ""}
                  onChange={(e) => set("cover", e.target.value)}
                />
              </div>
            </div>
          </div>
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
        {error && <p className="mt-3 text-[12.5px] font-semibold text-accent">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || uploading} className="btn-accent rounded-full px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
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
  const [deleting, setDeleting] = useState<CatalogBook | null>(null);
  const [toast, setToast] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [publishers, setPublishers] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setCategories(data.map((c) => c.name)));
    fetch("/api/admin/authors")
      .then((r) => r.json())
      .then((data: { name: string }[]) => setAuthors(data.map((a) => a.name)));
    fetch("/api/admin/publishers")
      .then((r) => r.json())
      .then((data: string[]) => setPublishers(data));
  }, []);

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

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const handleDelete = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/admin/books?id=${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      setToast(`Deleted "${deleting.title}"`);
      load();
    } else {
      setToast("Could not delete that book. Try again.");
    }
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
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
              <div className="h-12 w-9 animate-pulse rounded-md bg-[var(--surface-tint-strong)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--surface-tint-strong)]" />
                <div className="h-2.5 w-1/5 animate-pulse rounded bg-[var(--surface-tint)]" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-card p-8 text-center text-[13.5px] text-[var(--ink-faint)]">
          No books match &quot;{search}&quot;.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-faint)]">
                <th className="px-4 py-3 font-semibold" colSpan={2}>Title</th>
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
                  <td className="w-12 py-2 pl-4">
                    {b.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.cover} alt="" className="h-12 w-9 rounded-md border border-[var(--border)] object-cover" />
                    ) : (
                      <div className="grid h-12 w-9 place-items-center rounded-md bg-[var(--surface-tint-strong)] text-[9px] text-[var(--ink-faint)]">
                        No cover
                      </div>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 font-semibold text-[var(--ink)]">{b.title}</td>
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
                    <button onClick={() => setDeleting(b)} className="text-[12px] font-semibold text-accent hover:opacity-75">
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
          categories={categories}
          authors={authors}
          publishers={publishers}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setToast(editing.id ? "Book updated" : "Book added");
            load();
          }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Delete this book?"
          description={`"${deleting.title}" will be removed from the store immediately and can't be undone.`}
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}
