"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, DataTable, Dialog, Input, useToast, type Column } from "@/components/admin/ui";

type Category = { name: string; count: number; covers: string[]; image: string; order: number };

function EditCategoryDialog({ category, onCancel, onSaved }: { category: Category; onCancel: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [image, setImage] = useState(category.image);
  const [order, setOrder] = useState(category.order === 999 ? "" : String(category.order));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/categories", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: category.name, image, order: order ? Number(order) : 999 }) });
    setSaving(false);
    if (!res.ok) return toast((await res.json().catch(() => ({}))).error || "Couldn't save", { tone: "error" });
    toast("Category saved");
    onSaved();
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={category.name}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Input label="Featured image URL" data-autofocus value={image} onChange={(e) => setImage(e.target.value)} />
        <Input label="Display order" type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} hint="Lower numbers come first. Leave empty to sort by size." />
      </div>
    </Dialog>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Category>[] = [
    { key: "name", header: "Category", sortValue: (c) => c.name.toLowerCase(), cell: (c) => <span className="font-semibold">{c.name}</span> },
    { key: "count", header: "Books", width: "90px", align: "right", sortValue: (c) => c.count, cell: (c) => c.count },
    { key: "order", header: "Order", width: "90px", sortValue: (c) => c.order, cell: (c) => (c.order === 999 ? "-" : c.order) },
    { key: "image", header: "Featured image", hideBelow: "md", cell: (c) => <span className="block truncate text-[12px] text-[var(--ink-dim)]">{c.image || "Not set"}</span> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Categories</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">{categories.length} categories from your catalog. Click one to set a featured image and display order.</p>
      </div>
      <DataTable columns={columns} rows={categories} rowKey={(c) => c.name} loading={loading} caption="Categories" onRowClick={setEditing} rowHeight={56} />
      {editing && (
        <EditCategoryDialog
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
