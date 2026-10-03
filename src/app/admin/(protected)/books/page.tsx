"use client";

import { useCallback, useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import { money } from "@/lib/format";
import { bookHref } from "@/lib/links";
import { Badge, Button, Combobox, ConfirmDialog, DataTable, Dialog, Drawer, Input, Select, Textarea, useToast, type Column } from "@/components/admin/ui";

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
  stockQty: null,
  isbn: null,
  pages: null,
  language: null,
  publishedYear: null,
  binding: null,
  translator: null,
  isOwnTitle: false,
};

type Filter = "" | "missing_description" | "missing_publisher" | "archived";
const intOrNull = (v: string) => (v === "" ? null : Number(v));

function Cover({ src, className = "h-12 w-9" }: { src: string | null; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async" className={`${className} shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-tint)] object-cover`} />
  ) : (
    <div className={`${className} grid shrink-0 place-items-center rounded-md bg-[var(--surface-tint-strong)] text-[9px] text-[var(--ink-faint)]`}>No cover</div>
  );
}

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
  const set = <K extends keyof CatalogBook>(key: K, value: CatalogBook[K]) => setForm((f) => ({ ...f, [key]: value }));

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
      if (!res.ok) return setError(data.error || "Could not upload that image.");
      set("cover", data.url);
    } catch {
      setError("Network error while uploading. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return setError("Title is required");
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/books", { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error || "Could not save this book. Try again.");
      onSaved();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={isEdit ? "Edit book" : "Add book"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving} disabled={uploading}>
            {isEdit ? "Save changes" : "Add book"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Title" data-autofocus value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
        </div>
        <Combobox label="Author" value={form.author || ""} options={authors} onChange={(v) => set("author", v)} />
        <Combobox label="Publisher" value={form.publisher || ""} options={publishers} onChange={(v) => set("publisher", v)} />
        <Combobox label="Category" value={form.category || ""} options={categories} onChange={(v) => set("category", v)} />
        <Input label="Translator" value={form.translator ?? ""} onChange={(e) => set("translator", e.target.value || null)} />
        <Input label="Price (Rs.)" type="number" min={0} value={form.regularPrice ?? 0} onChange={(e) => set("regularPrice", Number(e.target.value))} />
        <Input label="Sale price (Rs.)" type="number" min={0} value={form.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : null)} hint="Leave empty if not on sale." />
        <Input label="Weight (g)" type="number" min={0} value={form.weight ?? 303} onChange={(e) => set("weight", Number(e.target.value))} />
        <Input label="Stock quantity" type="number" min={0} value={form.stockQty ?? ""} onChange={(e) => set("stockQty", intOrNull(e.target.value))} hint="Leave empty if you don't track stock for this book." />
        <Input label="ISBN" value={form.isbn ?? ""} onChange={(e) => set("isbn", e.target.value || null)} />
        <Input label="Pages" type="number" min={1} value={form.pages ?? ""} onChange={(e) => set("pages", intOrNull(e.target.value))} />
        <Input label="Published year" type="number" min={1400} max={2200} value={form.publishedYear ?? ""} onChange={(e) => set("publishedYear", intOrNull(e.target.value))} />
        <Select label="Language" value={form.language ?? ""} onChange={(e) => set("language", (e.target.value || null) as CatalogBook["language"])}>
          <option value="">Not set</option>
          <option value="si">Sinhala</option>
          <option value="en">English</option>
          <option value="ta">Tamil</option>
        </Select>
        <Select label="Binding" value={form.binding ?? ""} onChange={(e) => set("binding", e.target.value || null)}>
          <option value="">Not set</option>
          <option value="Paperback">Paperback</option>
          <option value="Hardcover">Hardcover</option>
        </Select>
        <div className="sm:col-span-2">
          <Textarea label="Description" rows={6} value={form.blurb || ""} onChange={(e) => set("blurb", e.target.value)} hint="No length limit. The book page shows about 4 lines with a Read more button." />
        </div>

        <div className="flex items-start gap-3 sm:col-span-2">
          <Cover src={form.cover || null} className="h-24 w-16" />
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-[12.5px] font-semibold text-[var(--ink-dim)]">Cover image</span>
            <label className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-tint)] px-5 text-[13px] font-bold text-[var(--ink)] hover:border-accent">
              {uploading ? "Uploading…" : form.cover ? "Replace image" : "Upload image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={handleFileSelect} />
            </label>
            <Input label="…or paste an image URL" value={form.cover || ""} onChange={(e) => set("cover", e.target.value)} />
          </div>
        </div>

        <fieldset className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          <legend className="sr-only">Flags</legend>
          {(
            [
              ["onSale", "On sale"],
              ["inStock", "In stock"],
              ["isOwnTitle", "Our title (Rasakatha)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex min-h-11 items-center gap-2.5 text-[13.5px] text-[var(--ink)]">
              <input type="checkbox" checked={key === "inStock" ? form.inStock !== false : !!form[key]} onChange={(e) => set(key, e.target.checked as never)} className="h-5 w-5 accent-accent" />
              {label}
            </label>
          ))}
        </fieldset>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[12.5px] font-semibold text-accent">
          {error}
        </p>
      )}
    </Dialog>
  );
}

export default function AdminBooksPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<CatalogBook[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("");
  const [counts, setCounts] = useState({ missingDescription: 0, missingPublisher: 0 });
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<CatalogBook | null>(null);
  const [editing, setEditing] = useState<Partial<CatalogBook> | null>(null);
  const [archiving, setArchiving] = useState<CatalogBook | null>(null);
  const [reason, setReason] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [publishers, setPublishers] = useState<string[]>([]);

  // deep links from the command palette: ?q=<book id/title>, ?new=1
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    queueMicrotask(() => {
      const q = sp.get("q");
      if (q) {
        setSearch(q);
        setDebounced(q);
      }
      if (sp.get("new")) setEditing(emptyForm);
    });
  }, []);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d: { name: string }[]) => setCategories(d.map((c) => c.name)));
    fetch("/api/admin/authors").then((r) => r.json()).then((d: { name: string }[]) => setAuthors(d.map((a) => a.name)));
    fetch("/api/admin/publishers").then((r) => r.json()).then((d: string[]) => setPublishers(d));
  }, []);

  // search is debounced so typing doesn't fire a request per key
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: "20", search: debounced, ...(filter ? { filter } : {}) });
    queueMicrotask(() => setLoading(true));
    fetch(`/api/admin/books?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setPageCount(data.pageCount ?? 1);
        if (data.counts) setCounts(data.counts);
        setLoading(false);
      });
  }, [page, debounced, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const archive = async () => {
    if (!archiving) return;
    const book = archiving;
    const res = await fetch(`/api/admin/books?id=${encodeURIComponent(book.id)}&reason=${encodeURIComponent(reason.trim())}`, { method: "DELETE" });
    setArchiving(null);
    setReason("");
    setViewing(null);
    if (!res.ok) return toast((await res.json().catch(() => ({}))).error || "Could not archive that book.", { tone: "error" });
    load();
    toast(`Archived “${book.title.split("|")[0].trim()}”`, {
      undo: async () => {
        await fetch("/api/admin/books", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: book.id }) });
        load();
        toast("Restored");
      },
    });
  };

  const restore = async (b: CatalogBook) => {
    await fetch("/api/admin/books", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id }) });
    setViewing(null);
    load();
    toast("Restored");
  };

  const columns: Column<CatalogBook>[] = [
    { key: "cover", header: "", width: "52px", cell: (b) => <Cover src={b.cover} /> },
    {
      key: "title",
      header: "Title",
      width: "minmax(0,2fr)",
      sortValue: (b) => b.title.toLowerCase(),
      cell: (b) => (
        <div className="min-w-0">
          <div className="truncate font-semibold">{b.title}</div>
          <div className="truncate text-[12px] text-[var(--ink-dim)]">
            {b.publisher || <span className="text-accent">No publisher</span>}
            {!b.blurb?.trim() && <span className="ml-2 text-amber-600">· no description</span>}
          </div>
        </div>
      ),
    },
    { key: "author", header: "Author", sortValue: (b) => b.author.toLowerCase(), hideBelow: "md", cell: (b) => <span className="block truncate text-[var(--ink-dim)]">{b.author}</span> },
    { key: "category", header: "Category", width: "130px", sortValue: (b) => b.category, hideBelow: "lg", cell: (b) => <span className="block truncate text-[var(--ink-dim)]">{b.category}</span> },
    { key: "price", header: "Price", width: "100px", align: "right", sortValue: (b) => (b.onSale && b.salePrice ? b.salePrice : b.regularPrice), cell: (b) => money(b.onSale && b.salePrice ? b.salePrice : b.regularPrice) },
    {
      key: "stock",
      header: "Stock",
      width: "130px",
      sortValue: (b) => (b.stockQty ?? (b.inStock ? 1 : 0)),
      cell: (b) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={b.inStock ? "success" : "accent"}>{b.inStock ? "In stock" : "Sold out"}</Badge>
          {b.stockQty != null && <span className="text-[12px] text-[var(--ink-dim)]">{b.stockQty}</span>}
        </span>
      ),
    },
    { key: "own", header: "Ours", width: "70px", hideBelow: "lg", hiddenByDefault: true, sortValue: (b) => Number(b.isOwnTitle), cell: (b) => (b.isOwnTitle ? <Badge tone="accent">Ours</Badge> : "") },
  ];

  const chip = (value: Filter, label: string, count?: number) => (
    <button
      key={value || "all"}
      onClick={() => {
        setPage(1);
        setFilter(value);
      }}
      aria-pressed={filter === value}
      className={`min-h-11 rounded-full px-4 text-[12.5px] font-semibold ${filter === value ? "bg-accent text-white" : "bg-[var(--surface-tint)] text-[var(--ink-dim)] hover:text-[var(--ink)]"}`}
    >
      {label}
      {count != null && <span className="ml-1.5 opacity-80">({count.toLocaleString()})</span>}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Books</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">{total.toLocaleString()} {filter === "archived" ? "archived " : ""}books.</p>
        </div>
        <Button variant="primary" onClick={() => setEditing(emptyForm)}>
          + Add book
        </Button>
      </div>

      <div className="max-w-sm">
        <Input label="Search books" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, author, ID or ISBN" />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter books">
        {chip("", "All books")}
        {chip("missing_description", "Missing description", counts.missingDescription)}
        {chip("missing_publisher", "Missing publisher", counts.missingPublisher)}
        {chip("archived", "Archived")}
        {(filter === "missing_description" || filter === "missing_publisher") && <span className="text-[12px] text-[var(--ink-faint)]">Rasakatha titles first, then newest.</span>}
      </div>

      <DataTable columns={columns} rows={items} rowKey={(b) => b.id} loading={loading} caption="Books" onRowClick={setViewing} storageKey="books" toolbar={null} />

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-[13px] text-[var(--ink-dim)]">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </Button>
          Page {page} of {pageCount}
          <Button size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Next →
          </Button>
        </div>
      )}

      <Drawer
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ""}
        subtitle={viewing ? `#${viewing.id}${viewing.author ? ` · ${viewing.author}` : ""}` : undefined}
        footer={
          viewing && (
            <>
              <a href={bookHref(viewing)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center px-3 text-[13px] font-semibold text-accent-blue hover:opacity-75">
                View on store ↗
              </a>
              {filter === "archived" ? (
                <Button variant="primary" onClick={() => restore(viewing)}>
                  Restore
                </Button>
              ) : (
                <>
                  <Button variant="danger" onClick={() => setArchiving(viewing)}>
                    Archive
                  </Button>
                  <Button variant="primary" onClick={() => { setEditing(viewing); setViewing(null); }}>
                    Edit
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="flex flex-col gap-5">
            <div className="flex gap-4">
              <Cover src={viewing.cover} className="h-40 w-28" />
              <dl className="grid flex-1 grid-cols-[auto_1fr] content-start gap-x-4 gap-y-1.5 text-[13px]">
                <dt className="text-[var(--ink-faint)]">Price</dt><dd>{money(viewing.regularPrice)}{viewing.onSale && viewing.salePrice ? ` → ${money(viewing.salePrice)}` : ""}</dd>
                <dt className="text-[var(--ink-faint)]">Stock</dt><dd>{viewing.stockQty != null ? `${viewing.stockQty} copies` : viewing.inStock ? "In stock (not counted)" : "Out of stock"}</dd>
                <dt className="text-[var(--ink-faint)]">Category</dt><dd>{viewing.category}</dd>
                <dt className="text-[var(--ink-faint)]">Publisher</dt><dd>{viewing.publisher ?? "-"} {viewing.isOwnTitle && <Badge tone="accent">Ours</Badge>}</dd>
                <dt className="text-[var(--ink-faint)]">Published</dt><dd>{viewing.publishedAt ? new Date(viewing.publishedAt).toLocaleDateString("en-GB") : "-"}</dd>
                {viewing.isbn && (<><dt className="text-[var(--ink-faint)]">ISBN</dt><dd>{viewing.isbn}</dd></>)}
                {viewing.pages && (<><dt className="text-[var(--ink-faint)]">Pages</dt><dd>{viewing.pages}</dd></>)}
              </dl>
            </div>
            <div>
              <h3 className="mb-1 text-[12px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">Description</h3>
              {viewing.blurb?.trim() ? <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--ink)]">{viewing.blurb}</p> : <p className="text-[13px] text-amber-600">No description yet.</p>}
            </div>
          </div>
        )}
      </Drawer>

      {editing && (
        <BookForm
          initial={editing}
          categories={categories}
          authors={authors}
          publishers={publishers}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            toast(editing.id ? "Book updated" : "Book added");
            setEditing(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!archiving}
        danger
        title="Archive this book?"
        description={archiving ? `“${archiving.title}” is hidden from the store straight away. Nothing is deleted: you can restore it from the Archived filter.` : undefined}
        confirmLabel="Archive"
        onCancel={() => {
          setArchiving(null);
          setReason("");
        }}
        onConfirm={() => reason.trim().length >= 3 && archive()}
      >
        <Input label="Why? (required)" data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. out of print, duplicate" />
      </ConfirmDialog>
    </div>
  );
}
