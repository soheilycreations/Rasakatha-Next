"use client";

import { useEffect, useState } from "react";
import AuthorAvatar from "./AuthorAvatar";
import { IconStar } from "./icons";
import { useStore } from "./StoreContext";

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar
          key={i}
          style={{
            width: size,
            height: size,
            fill: i < Math.round(value) ? "#f5b301" : "none",
            color: i < Math.round(value) ? "#f5b301" : "var(--ink-faint)",
          }}
        />
      ))}
    </div>
  );
}

// Reviews are stored in Supabase and shown to everyone. Only signed-in
// customers can post (one review per book), which keeps out anonymous spam.
export default function ProductReviews({ bookId }: { bookId: string }) {
  const { account, openAuth } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?book=${encodeURIComponent(bookId)}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: Review[] }) => setReviews(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [bookId]);

  const submitReview = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, rating, text: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Couldn't post your review. Please try again.");
        return;
      }
      setReviews((r) => [data as Review, ...r.filter((x) => x.id !== (data as Review).id)]);
      setText("");
      setRating(5);
    } finally {
      setPosting(false);
    }
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <section className="mt-14 border-t border-[var(--border)] pt-10" aria-labelledby="reviews-heading">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 id="reviews-heading" className="font-display text-lg font-bold text-[var(--ink)]">
          Reader Reviews
        </h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--ink-faint)]">
            <Stars value={avgRating} size={13} />
            {avgRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] p-5">
        {account ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-semibold text-[var(--ink)]">Your rating</span>
              <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                    aria-pressed={rating === n}
                  >
                    <IconStar
                      className="h-[20px] w-[20px]"
                      style={{
                        fill: n <= (hoverRating || rating) ? "#f5b301" : "none",
                        color: n <= (hoverRating || rating) ? "#f5b301" : "var(--ink-faint)",
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think of this book?"
              aria-label="Your review"
              rows={3}
              maxLength={2000}
              className="mt-3 w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-accent/50 focus:outline-none"
            />
            {error && <p className="mt-2 text-[12.5px] text-accent">{error}</p>}
            <button
              onClick={submitReview}
              disabled={!text.trim() || posting}
              className="btn-accent mt-3 rounded-full px-6 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post Review"}
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13.5px] text-[var(--ink-dim)]">Read this book? Sign in to share a review with other readers.</p>
            <button
              onClick={openAuth}
              className="btn-accent rounded-full px-5 py-2.5 text-[13px] font-bold text-white"
            >
              Sign in to review
            </button>
          </div>
        )}
      </div>

      {!loaded ? null : reviews.length === 0 ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">No reviews yet — be the first to review this book.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={r.id} className="flex gap-3">
              <AuthorAvatar name={r.name} size={38} className="text-[13px]" />
              <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-card px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-[13.5px] font-semibold text-[var(--ink)]">{r.name}</span>
                  <span className="text-[11px] text-[var(--ink-faint)]">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="mt-1">
                  <Stars value={r.rating} />
                </div>
                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--ink-dim)]">{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
