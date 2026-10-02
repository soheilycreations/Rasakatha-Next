"use client";

import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../ConfirmModal";
import Toast from "../Toast";

type Review = {
  id: string;
  bookId: string;
  bookTitle: string;
  name: string;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const [toast, setToast] = useState("");

  const load = () =>
    fetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((d: { items: Review[]; tableMissing?: boolean }) => {
        setItems(d.items);
        setTableMissing(!!d.tableMissing);
        setLoading(false);
      });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (filter === "visible" && !r.approved) return false;
      if (filter === "hidden" && r.approved) return false;
      return !q || r.name.toLowerCase().includes(q) || r.bookTitle.toLowerCase().includes(q) || r.text.toLowerCase().includes(q);
    });
  }, [items, filter, search]);

  const setApproved = async (r: Review, approved: boolean) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, approved }),
    });
    if (!res.ok) return setToast("Couldn't update the review");
    setItems((list) => list.map((x) => (x.id === r.id ? { ...x, approved } : x)));
    setToast(approved ? "Review is now visible" : "Review hidden");
  };

  const remove = async (r: Review) => {
    setToDelete(null);
    const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
    if (!res.ok) return setToast("Couldn't delete the review");
    setItems((list) => list.filter((x) => x.id !== r.id));
    setToast("Review deleted");
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Reviews</h1>
      <p className="mt-1 text-[13px] text-[var(--ink-dim)]">
        Hide or delete reviews that shouldn&apos;t be public. Book star ratings update automatically.
      </p>

      {tableMissing && (
        <p role="alert" className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3 text-[13px] text-[var(--ink)]">
          The reviews table doesn&apos;t exist yet. Run <code>supabase/reviews.sql</code> in the Supabase SQL Editor.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reviewer, book or text…"
          aria-label="Search reviews"
          className="w-full max-w-xs rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)]"
        />
        {(["all", "visible", "hidden"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold capitalize ${
              filter === f ? "bg-accent text-white" : "bg-[var(--surface-tint)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-[13px] text-[var(--ink-dim)]">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-[13px] text-[var(--ink-dim)]">No reviews to show.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {filtered.map((r) => (
            <li key={r.id} className={`rounded-2xl border border-[var(--border)] bg-card p-4 ${r.approved ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--ink)]">
                    {r.name} <span className="ml-1 text-accent" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  <div className="truncate text-[12px] text-[var(--ink-dim)]">
                    on {r.bookTitle} · {new Date(r.createdAt).toLocaleDateString("en-GB")}
                    {!r.approved && <span className="ml-2 font-bold uppercase text-accent">Hidden</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setApproved(r, !r.approved)}
                    className="rounded-full border border-[var(--border-strong)] px-3.5 py-1.5 text-[12.5px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-tint)]"
                  >
                    {r.approved ? "Hide" : "Approve"}
                  </button>
                  <button
                    onClick={() => setToDelete(r)}
                    className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-accent hover:bg-accent/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13.5px] text-[var(--ink)]">{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete this review?"
          description={`${toDelete.name}'s review of ${toDelete.bookTitle} will be removed permanently.`}
          onCancel={() => setToDelete(null)}
          onConfirm={() => remove(toDelete)}
        />
      )}
      {toast && <Toast message={toast} />}
    </div>
  );
}
