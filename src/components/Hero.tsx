"use client";

import { useState } from "react";
import CoverArt from "./CoverArt";
import { featured } from "@/lib/data";
import { IconPlay, IconStar } from "./icons";

export default function Hero() {
  const [active, setActive] = useState(0);
  const book = featured[active];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-bg-card">
      <div
        className="absolute inset-0 opacity-40 blur-2xl transition-colors duration-700"
        style={{
          background: `radial-gradient(60% 60% at 75% 20%, ${book.cover.from}, transparent)`,
        }}
      />

      <div className="relative flex flex-col gap-8 p-6 md:flex-row md:items-center md:p-10">
        <div className="flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-accent">
            Featured story
          </span>

          <h1 className="mt-4 font-display text-3xl font-semibold italic leading-tight text-ink md:text-[2.6rem]">
            {book.title}
          </h1>
          {book.titleSi && <p className="mt-1 text-lg text-ink-dim">{book.titleSi}</p>}

          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-dim md:text-[0.95rem]">
            {book.blurb}
          </p>

          <div className="mt-4 flex items-center gap-4 text-sm text-ink-dim">
            <span>{book.author}</span>
            <span className="h-1 w-1 rounded-full bg-ink-faint" />
            <span className="flex items-center gap-1 text-accent">
              <IconStar className="h-3.5 w-3.5" /> {book.rating}
            </span>
            <span className="h-1 w-1 rounded-full bg-ink-faint" />
            <span>{book.category}</span>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <button className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink transition-transform hover:scale-[1.02]">
              Rs. {book.price} · Add to cart
            </button>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-ink transition-colors hover:bg-white/10">
              <IconPlay className="h-4 w-4 translate-x-[1px]" />
            </button>
            <span className="text-xs text-ink-faint">Preview sample</span>
          </div>
        </div>

        <div className="relative mx-auto flex h-56 w-full max-w-[300px] items-center justify-center md:h-72">
          {featured.map((b, i) => {
            const offset = i - active;
            if (Math.abs(offset) > 1) return null;
            return (
              <div
                key={b.id}
                className="absolute h-56 w-40 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 transition-all duration-500 md:h-72 md:w-48"
                style={{
                  transform: `translateX(${offset * 78}px) rotate(${offset * 6}deg) scale(${offset === 0 ? 1 : 0.82})`,
                  zIndex: offset === 0 ? 10 : 5 - Math.abs(offset),
                  opacity: offset === 0 ? 1 : 0.55,
                }}
              >
                <CoverArt cover={b.cover} title={b.title} titleSi={b.titleSi} className="h-full w-full" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative flex items-center justify-center gap-2 pb-6">
        {featured.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setActive(i)}
            aria-label={`Show ${b.title}`}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-6 bg-accent" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
