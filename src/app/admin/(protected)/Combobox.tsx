"use client";

import { useEffect, useRef, useState } from "react";

export default function Combobox({
  value,
  options,
  placeholder,
  onChange,
  className = "",
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setQuery(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, value]);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  const exactMatch = options.some((o) => o.toLowerCase() === q);

  const select = (v: string) => {
    setQuery(v);
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        className={className}
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && (filtered.length > 0 || (q && !exactMatch)) && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[var(--border)] bg-card py-1 shadow-lg">
          {q && !exactMatch && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(query.trim())}
              className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-[13px] font-semibold text-accent hover:bg-[var(--surface-tint)]"
            >
              + Add &quot;{query.trim()}&quot;
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(o)}
              className="block w-full truncate px-3 py-2 text-left text-[13px] text-[var(--ink)] hover:bg-[var(--surface-tint)]"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
