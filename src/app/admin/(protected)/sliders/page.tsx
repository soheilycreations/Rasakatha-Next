"use client";

import { useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/hero-slides";

const emptyForm: Partial<HeroSlide> = { id: "", title: "", cover: "", author: "", price: undefined };

type SlideDraft = Partial<HeroSlide> & { __editing?: boolean };

function SlideForm({ initial, onCancel, onSaved }: { initial: SlideDraft; onCancel: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<SlideDraft>(initial);
  const [saving, setSaving] = useState(false);
  const editing = !!initial.__editing;

  const set = <K extends keyof HeroSlide>(key: K, value: HeroSlide[K]) => setForm((f) => ({ ...f, [key]: value }));

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--surface-tint)] px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50";

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/hero-slides", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-[16px] font-bold text-[var(--ink)]">{editing ? "Edit Slide" : "Add Slide"}</h3>
        <div className="grid gap-3">
          <input className={inputClass} placeholder="Title" value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
          <input className={inputClass} placeholder="Cover image path (e.g. /hero/my-slide.png)" value={form.cover || ""} onChange={(e) => set("cover", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Author (optional)" value={form.author || ""} onChange={(e) => set("author", e.target.value)} />
            <input
              className={inputClass}
              type="number"
              placeholder="Price (optional)"
              value={form.price ?? ""}
              onChange={(e) => set("price", e.target.value ? Number(e.target.value) : (undefined as unknown as number))}
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-accent rounded-full px-5 py-2 text-[13px] font-bold text-white disabled:opacity-60">
            {saving ? "Saving…" : "Save Slide"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSlidersPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SlideDraft | null>(null);

  const load = () => {
    fetch("/api/admin/hero-slides")
      .then((r) => r.json())
      .then((data) => {
        setSlides(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this hero slide?")) return;
    await fetch(`/api/admin/hero-slides?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Hero Sliders</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-faint)]">Manage the homepage carousel images.</p>
        </div>
        <button onClick={() => setEditing({ ...emptyForm, __editing: false })} className="btn-accent rounded-full px-5 py-2.5 text-[13px] font-bold text-white">
          + Add Slide
        </button>
      </div>

      {loading ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s) => (
            <div key={s.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
              <div className="relative h-36 w-full bg-[var(--surface-tint)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.cover} alt={s.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-3.5">
                <div className="truncate text-[13px] font-bold text-[var(--ink)]">{s.title}</div>
                {s.author && <div className="text-[11.5px] text-[var(--ink-faint)]">{s.author}</div>}
                <div className="mt-2.5 flex gap-3">
                  <button onClick={() => setEditing({ ...s, __editing: true })} className="text-[12px] font-semibold text-accent-blue hover:opacity-75">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-[12px] font-semibold text-accent hover:opacity-75">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SlideForm
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
