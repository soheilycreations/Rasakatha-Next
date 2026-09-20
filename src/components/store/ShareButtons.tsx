"use client";

import { useState } from "react";
import { IconShare, IconLink } from "./icons";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = (kind: "whatsapp" | "facebook" | "x") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${title} — Rasakatha.lk`;
    const links = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    };
    window.open(links[kind], "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  const buttons: { key: "whatsapp" | "facebook" | "x"; label: string; bg: string }[] = [
    { key: "whatsapp", label: "W", bg: "#25D366" },
    { key: "facebook", label: "f", bg: "#1877F2" },
    { key: "x", label: "X", bg: "#111111" },
  ];

  return (
    <div className="flex items-center gap-2.5">
      <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-faint)]">
        <IconShare className="h-4 w-4" />
        Share
      </span>
      {buttons.map((b) => (
        <button
          key={b.key}
          onClick={() => share(b.key)}
          aria-label={`Share on ${b.key}`}
          className="grid h-8 w-8 place-items-center rounded-full text-[12.5px] font-bold text-white transition-transform hover:scale-110"
          style={{ background: b.bg }}
        >
          {b.label}
        </button>
      ))}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="relative grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] text-[var(--ink-dim)] transition-colors hover:border-accent/40 hover:text-accent"
      >
        <IconLink className="h-4 w-4" />
        {copied && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--ink)] px-2 py-1 text-[10.5px] font-semibold text-[var(--panel)]">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
