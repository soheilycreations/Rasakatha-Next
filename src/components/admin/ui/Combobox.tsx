"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fieldClass } from "./Input";

// Free-text field with suggestions (type to filter, pick with arrows/Enter/click, or keep what you typed).
// A visible label is required.
export default function Combobox({
  label,
  value,
  options,
  onChange,
  hint,
  placeholder,
  allowNew = true,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  allowNew?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setQuery(value));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!allowNew) setQuery(value);
        else onChange(query.trim());
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, value, query, allowNew, onChange]);

  const q = query.trim().toLowerCase();
  const filtered = (q ? options.filter((o) => o.toLowerCase().includes(q)) : options).slice(0, 50);

  const pick = (o: string) => {
    onChange(o);
    setQuery(o);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-[var(--ink-dim)]">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            if (filtered[active]) pick(filtered[active]);
            else if (allowNew) pick(query.trim());
          } else if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
            setQuery(value);
          }
        }}
        className={`${fieldClass} border-[var(--border)]`}
      />
      {hint && <p className="text-[12px] text-[var(--ink-faint)]">{hint}</p>}
      {open && (filtered.length > 0 || (allowNew && q)) && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-card p-1 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
        >
          {filtered.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(o)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-[13.5px] text-[var(--ink)] ${i === active ? "bg-[var(--surface-tint-strong)]" : ""}`}
            >
              {o}
            </li>
          ))}
          {allowNew && q && !options.some((o) => o.toLowerCase() === q) && (
            <li role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(query.trim())} className="cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold text-accent-blue">
              Use &ldquo;{query.trim()}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
