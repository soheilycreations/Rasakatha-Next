"use client";

import { useEffect, useState } from "react";

type Category = { name: string; count: number; covers: string[]; image: string; order: number };

function EditCategoryModal({ category, onCancel, onSaved }: { category: Category; onCancel: () => void; onSaved: () => void }) {
  const [image, setImage] = useState(category.image);
  const [order, setOrder] = useState(category.order === 999 ? "" : String(category.order));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: category.name, image, order: order ? Number(order) : 999 }),
    });
    setSaving(false);
    onSaved();
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-[16px] font-bold text-[var(--ink)]">{category.name}</h3>
        <div className="grid gap-3">
          <input className={inputClass} placeholder="Featured image URL" value={image} onChange={(e) => setImage(e.target.value)} />
          <input className={inputClass} type="number" placeholder="Display order (lower = first)" value={order} onChange={(e) => setOrder(e.target.value)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-accent rounded-full px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = () => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Categories</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          {categories.length} categories from your catalog. Set a featured image and display order.
        </p>
      </div>

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--ink-faint)]">
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Books</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Featured Image</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.name} className="border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--surface-tint)]">
                  <td className="px-4 py-3 font-semibold text-[var(--ink)]">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{c.count}</td>
                  <td className="px-4 py-3 text-[var(--ink-dim)]">{c.order === 999 ? "—" : c.order}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[12px] text-[var(--ink-faint)]">{c.image || "Not set"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditing(c)} className="text-[12px] font-semibold text-accent-blue hover:opacity-75">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <EditCategoryModal
          category={editing}
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
