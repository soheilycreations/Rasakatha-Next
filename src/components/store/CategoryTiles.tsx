"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Category = { name: string; count: number; covers: string[] };

const GRADIENTS = [
  "linear-gradient(160deg, #7c1c18, #1a0908)",
  "linear-gradient(160deg, #1f4d63, #0a1519)",
  "linear-gradient(160deg, #5a3b1e, #150f09)",
  "linear-gradient(160deg, #2f5a3a, #0c130e)",
  "linear-gradient(160deg, #3d2a52, #120c18)",
  "linear-gradient(160deg, #6b2320, #180706)",
  "linear-gradient(160deg, #4a3a1c, #150f08)",
  "linear-gradient(160deg, #155158, #061818)",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

const FAN = [
  { rotate: -10, x: -30, z: 1 },
  { rotate: 0, x: 0, z: 3 },
  { rotate: 10, x: 30, z: 2 },
];

export default function CategoryTiles({ onSelect }: { onSelect: (name: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data.slice(0, 8)));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="mb-10 px-6 sm:px-8">
      <h3 className="font-display mb-3.5 text-lg font-bold text-[var(--ink)] sm:text-xl">Browse by Genre</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => onSelect(c.name)}
            className="tile-hover group relative flex h-[168px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] text-left shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_18px_38px_rgba(0,0,0,0.6)] sm:h-[184px]"
            style={{ background: gradientFor(c.name) }}
          >
            <div className="relative flex flex-1 items-center justify-center pt-4">
              {c.covers.map((cover, i) => {
                const f = FAN[i] ?? FAN[1];
                return (
                  <div
                    key={cover}
                    className="absolute h-[88px] w-[62px] overflow-hidden rounded-md border border-white/15 shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-[350ms] ease-[var(--ease-premium)] group-hover:-translate-y-1.5 sm:h-[100px] sm:w-[70px]"
                    style={{
                      transform: `translateX(${f.x}px) rotate(${f.rotate}deg)`,
                      zIndex: f.z,
                    }}
                  >
                    <Image src={cover} alt="" fill sizes="70px" className="object-cover" />
                  </div>
                );
              })}
            </div>

            <div className="relative bg-gradient-to-t from-black/70 to-transparent px-3.5 pb-3 pt-6">
              <span className="block text-sm font-bold text-white sm:text-base">{c.name}</span>
              <span className="text-[11px] text-white/65">{c.count} books</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
