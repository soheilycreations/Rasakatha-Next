"use client";

import { useEffect, useState } from "react";
import AuthorAvatar from "./AuthorAvatar";
import { IconStar, IconThumbsUp } from "./icons";

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: number;
  likes: number;
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ProductReviews({ bookId }: { bookId: string }) {
  const reviewsKey = `rasakatha:reviews:${bookId}`;
  const likesKey = `rasakatha:review-likes:${bookId}`;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedReviews = localStorage.getItem(reviewsKey);
        if (savedReviews) setReviews(JSON.parse(savedReviews));
        const savedLikes = localStorage.getItem(likesKey);
        if (savedLikes) setLikedIds(JSON.parse(savedLikes));
      } catch {
        // ignore malformed/unavailable storage
      }
      setHydrated(true);
    });
  }, [reviewsKey, likesKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(reviewsKey, JSON.stringify(reviews));
    } catch {
      // storage unavailable — reviews just won't persist
    }
  }, [reviews, reviewsKey, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(likesKey, JSON.stringify(likedIds));
    } catch {
      // storage unavailable — likes just won't persist
    }
  }, [likedIds, likesKey, hydrated]);

  const submitReview = () => {
    const trimmedName = name.trim() || "Anonymous Reader";
    const trimmedText = text.trim();
    if (!trimmedText) return;
    const review: Review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      rating,
      text: trimmedText,
      date: Date.now(),
      likes: 0,
    };
    setReviews((r) => [review, ...r]);
    setText("");
    setName("");
    setRating(5);
  };

  const toggleLike = (id: string) => {
    const isLiked = !!likedIds[id];
    setLikedIds((l) => ({ ...l, [id]: !isLiked }));
    setReviews((r) => r.map((rv) => (rv.id === id ? { ...rv, likes: rv.likes + (isLiked ? -1 : 1) } : rv)));
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mt-14 border-t border-[var(--border)] pt-10">
      <div className="mb-6 flex items-center gap-3">
        <h3 className="font-display text-lg font-bold text-[var(--ink)]">Reader Feedback</h3>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1 text-[13px] text-[var(--ink-faint)]">
            <IconStar className="h-3.5 w-3.5" style={{ fill: "#f5b301", color: "#f5b301" }} />
            {avgRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="min-w-0 flex-1 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-accent/50 focus:outline-none"
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate ${n} stars`}
              >
                <IconStar
                  className="h-[19px] w-[19px]"
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
          placeholder="Share your thoughts on this book..."
          rows={3}
          className="mt-3 w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-accent/50 focus:outline-none"
        />
        <button
          onClick={submitReview}
          disabled={!text.trim()}
          className="btn-accent mt-3 rounded-full px-6 py-2.5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Post Feedback
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-[13.5px] text-[var(--ink-faint)]">
          No feedback yet — be the first to share your thoughts on this book.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <AuthorAvatar name={r.name} size={38} className="text-[13px]" />
              <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-card px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="text-[13.5px] font-semibold text-[var(--ink)]">{r.name}</span>
                  <span className="text-[11px] text-[var(--ink-faint)]">{timeAgo(r.date)}</span>
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <IconStar
                      key={i}
                      className="h-3 w-3"
                      style={{
                        fill: i < r.rating ? "#f5b301" : "none",
                        color: i < r.rating ? "#f5b301" : "var(--ink-faint)",
                      }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-dim)]">{r.text}</p>
                <button
                  onClick={() => toggleLike(r.id)}
                  className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                  style={{ color: likedIds[r.id] ? "#EF4238" : "var(--ink-faint)" }}
                >
                  <IconThumbsUp
                    className="h-[15px] w-[15px]"
                    style={{ fill: likedIds[r.id] ? "currentColor" : "none" }}
                  />
                  {r.likes > 0 ? r.likes : ""} Helpful
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
