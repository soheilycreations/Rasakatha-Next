"use client";

import { useEffect, useRef, useState } from "react";
import { onFlyToCart } from "@/lib/fly-to-cart";

type Box = { left: number; top: number; width: number; height: number };

type FlyItem = {
  id: number;
  imgSrc?: string | null;
  tint?: string;
  start: Box;
  end: Box;
  phase: "start" | "end";
};

function getCartTargetRect(): Box {
  const el = document.querySelector('[aria-label="Cart"]');
  const r = el?.getBoundingClientRect();
  if (!r) return { left: window.innerWidth - 50, top: 24, width: 16, height: 16 };
  return { left: r.left + r.width / 2 - 8, top: r.top + r.height / 2 - 8, width: 16, height: 16 };
}

function bumpCartIcon() {
  const el = document.querySelector('[aria-label="Cart"]');
  if (!el) return;
  el.classList.remove("cart-bump");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("cart-bump");
  window.setTimeout(() => el.classList.remove("cart-bump"), 450);
}

export default function FlyToCartLayer() {
  const [items, setItems] = useState<FlyItem[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    return onFlyToCart(({ rect, imgSrc, tint }) => {
      const id = ++idRef.current;
      const start: Box = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      const end = getCartTargetRect();

      setItems((prev) => [...prev, { id, imgSrc, tint, start, end, phase: "start" }]);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setItems((prev) => prev.map((it) => (it.id === id ? { ...it, phase: "end" } : it)));
        });
      });

      window.setTimeout(() => {
        setItems((prev) => prev.filter((it) => it.id !== id));
        bumpCartIcon();
      }, 640);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      {items.map((it) => {
        const box = it.phase === "start" ? it.start : it.end;
        return (
          <div
            key={it.id}
            className="absolute overflow-hidden rounded-lg shadow-[0_14px_28px_-10px_rgba(0,0,0,0.55)]"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              opacity: it.phase === "start" ? 1 : 0,
              transform: it.phase === "end" ? "rotate(16deg)" : "rotate(0deg)",
              transition:
                "left 620ms cubic-bezier(0.34,0.02,0.35,1), top 620ms cubic-bezier(0.34,0.02,0.35,1), width 620ms cubic-bezier(0.34,0.02,0.35,1), height 620ms cubic-bezier(0.34,0.02,0.35,1), transform 620ms ease, opacity 280ms ease 340ms",
              background: it.imgSrc ? undefined : it.tint,
            }}
          >
            {it.imgSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.imgSrc} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}
