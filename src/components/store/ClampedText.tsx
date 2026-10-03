"use client";

import { useEffect, useRef, useState } from "react";

// Shows about 4 lines of a long description with a "Read more" toggle. The full text is always in
// the HTML (for search engines and no-JS visitors); the toggle only appears when the text overflows.
export default function ClampedText({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (!open) setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  return (
    <div className="mt-5 max-w-xl">
      <p ref={ref} className={`${className} whitespace-pre-line ${open ? "" : "line-clamp-4"}`}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2 text-[13px] font-semibold text-accent-blue hover:opacity-75"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
