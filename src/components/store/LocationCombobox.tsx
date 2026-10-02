"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { SRI_LANKA_LOCATIONS } from "@/lib/shipping";

type Opt = { town: string; district: string; label: string };

const OPTIONS: Opt[] = SRI_LANKA_LOCATIONS.flatMap((d) =>
  d.towns.map((town) => ({ town, district: d.name, label: `${town}, ${d.name}`.toLowerCase() }))
);

const MAX_SHOWN = 40;

// Searchable district -> town picker. The value is the town name, exactly what the
// old <select> produced, so shipping zones (src/lib/shipping.ts) are untouched.
export default function LocationCombobox({
  value,
  onChange,
  hasError,
  label = "Delivery city or town",
}: {
  value: string;
  onChange: (town: string) => void;
  hasError: boolean;
  label?: string;
}) {
  const listId = useId();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Follow external changes (prefilled address, reset).
  useEffect(() => {
    // only follow a real pick; clearing happens while the user is typing
    if (value) queueMicrotask(() => setText(value));
  }, [value]);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q || q === value.toLowerCase()) return OPTIONS.slice(0, MAX_SHOWN);
    const starts: Opt[] = [];
    const contains: Opt[] = [];
    for (const o of OPTIONS) {
      if (o.town.toLowerCase().startsWith(q)) starts.push(o);
      else if (o.label.includes(q)) contains.push(o);
    }
    return [...starts, ...contains].slice(0, MAX_SHOWN);
  }, [text, value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setText(value); // discard half-typed text that isn't a real town
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, value]);

  const choose = (o: Opt) => {
    onChange(o.town);
    setText(o.town);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Type your city or town"
        value={text}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
          if (value) onChange(""); // typing invalidates the previous pick
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            choose(matches[active]);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
            setText(value);
          }
        }}
        className={`w-full rounded-xl border bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors ${
          hasError ? "border-accent" : "border-[var(--border)]"
        }`}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-card p-1 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
        >
          {matches.length === 0 && <li className="px-3 py-2 text-[13px] text-[var(--ink-dim)]">No matching town</li>}
          {matches.map((o, i) => (
            <li
              key={`${o.district}-${o.town}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              ref={(el) => {
                if (el && i === active) el.scrollIntoView({ block: "nearest" });
              }}
              className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-[13.5px] ${
                i === active ? "bg-[var(--surface-tint-strong)]" : ""
              }`}
            >
              <span className="font-semibold text-[var(--ink)]">{o.town}</span>
              <span className="text-[12px] text-[var(--ink-dim)]">{o.district}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
