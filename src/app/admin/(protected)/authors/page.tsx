"use client";

import { useEffect, useState } from "react";

type Author = { name: string; count: number; avgRating: number; covers: string[]; bio: string; photo: string };

function EditAuthorModal({ author, onCancel, onSaved }: { author: Author; onCancel: () => void; onSaved: () => void }) {
  const [bio, setBio] = useState(author.bio);
  const [photo, setPhoto] = useState(author.photo);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/authors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: author.name, bio, photo }),
    });
    setSaving(false);
    onSaved();
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-[16px] font-bold text-[var(--ink)]">{author.name}</h3>
        <div className="grid gap-3">
          <input className={inputClass} placeholder="Photo URL" value={photo} onChange={(e) => setPhoto(e.target.value)} />
          <textarea className={`${inputClass} resize-none`} placeholder="Short bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
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

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Author | null>(null);

  const load = () => {
    fetch("/api/admin/authors")
      .then((r) => r.json())
      .then((data) => {
        setAuthors(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Authors</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">
          {authors.length} authors derived from your catalog. Add a bio and photo to feature them.
        </p>
      </div>

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => (
            <div key={a.name} className="rounded-2xl border border-[var(--border)] bg-card p-4">
              <div className="flex items-center gap-3">
                {a.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.photo} alt={a.name} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/[0.12] text-[14px] font-bold text-accent">
                    {a.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-bold text-[var(--ink)]">{a.name}</div>
                  <div className="text-[11.5px] text-[var(--ink-faint)]">
                    {a.count} books · ★ {a.avgRating.toFixed(1)}
                  </div>
                </div>
              </div>
              {a.bio && <p className="mt-2.5 line-clamp-2 text-[12px] text-[var(--ink-dim)]">{a.bio}</p>}
              <button onClick={() => setEditing(a)} className="mt-3 text-[12px] font-semibold text-accent-blue hover:opacity-75">
                Edit profile
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditAuthorModal
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
