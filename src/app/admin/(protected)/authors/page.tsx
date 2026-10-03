"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Dialog, EmptyState, Input, SkeletonRows, Textarea, useToast } from "@/components/admin/ui";

type Author = { name: string; count: number; avgRating: number; covers: string[]; bio: string; photo: string };

function EditAuthorDialog({ author, onCancel, onSaved }: { author: Author; onCancel: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [bio, setBio] = useState(author.bio);
  const [photo, setPhoto] = useState(author.photo);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/authors", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: author.name, bio, photo }) });
    setSaving(false);
    if (!res.ok) return toast((await res.json().catch(() => ({}))).error || "Couldn't save", { tone: "error" });
    toast("Author saved");
    onSaved();
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={author.name}
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
        <Input label="Photo URL" data-autofocus value={photo} onChange={(e) => setPhoto(e.target.value)} />
        <Textarea label="Short bio" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
    </Dialog>
  );
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Author | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/authors")
      .then((r) => r.json())
      .then((data) => {
        setAuthors(data);
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const shown = authors.filter((a) => a.name.toLowerCase().includes(filter.trim().toLowerCase())).slice(0, 120);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Authors</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">{authors.length.toLocaleString()} authors derived from your catalog. Add a bio and photo to feature them.</p>
      </div>
      <div className="max-w-sm">
        <Input label="Find an author" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      {loading ? (
        <SkeletonRows />
      ) : shown.length === 0 ? (
        <EmptyState title="No authors match" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <div key={a.name} className="rounded-2xl border border-[var(--border)] bg-card p-4">
              <div className="flex items-center gap-3">
                {a.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.photo} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/[0.12] text-[14px] font-bold text-accent">{a.name.charAt(0)}</div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-[var(--ink)]">{a.name}</div>
                  <div className="text-[11.5px] text-[var(--ink-dim)]">
                    {a.count} book{a.count === 1 ? "" : "s"}
                    {a.avgRating > 0 ? ` · ★ ${a.avgRating.toFixed(1)}` : ""}
                  </div>
                </div>
              </div>
              {a.bio && <p className="mt-2.5 line-clamp-2 text-[12px] text-[var(--ink-dim)]">{a.bio}</p>}
              <Button size="sm" variant="ghost" className="mt-2 -ml-2 text-accent-blue" onClick={() => setEditing(a)}>
                Edit profile
              </Button>
            </div>
          ))}
        </div>
      )}
      {authors.length > shown.length && !filter && <p className="text-[12px] text-[var(--ink-faint)]">Showing the first {shown.length}. Use the search box to find others.</p>}

      {editing && (
        <EditAuthorDialog
          author={editing}
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
