"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DISTRICTS } from "@/lib/shipping";
import { searchLocations } from "@/lib/locationSearch";

export type Place = { town: string; district: string; custom: boolean };

const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors ${
    hasError ? "border-accent" : "border-[var(--border)]"
  }`;

// Searchable picker over every Sri Lanka Post town (by town, district or postal code). The value is
// the town name (what shipping zones use). If the town isn't listed, the customer picks a district and
// types the town; that order is priced as the standard zone and flagged for the store.
export default function LocationCombobox({
  value,
  onChange,
  hasError,
  label = "Delivery city or town",
}: {
  value: Place;
  onChange: (place: Place) => void;
  hasError: boolean;
  label?: string;
}) {
  const listId = useId();
  const [text, setText] = useState(value.custom ? "" : value.town);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(value.custom);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Follow external changes (prefilled address) but never overwrite what is being typed.
  useEffect(() => {
    if (value.custom) queueMicrotask(() => setManual(true));
    else if (value.town) queueMicrotask(() => setText(value.town));
  }, [value.town, value.custom]);

  const results = useMemo(() => (text.trim() && text !== value.town ? searchLocations(text, 40) : []), [text, value.town]);
  // options: matches, then the "not listed" escape hatch
  const optionCount = results.length + 1;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setText(value.town); // discard half-typed text that isn't a real pick
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, value.town]);

  const choose = (index: number) => {
    if (index >= results.length) {
      setManual(true);
      setOpen(false);
      onChange({ town: "", district: "", custom: true });
      return;
    }
    const loc = results[index];
    onChange({ town: loc.town, district: loc.district, custom: false });
    setText(loc.town);
    setOpen(false);
  };

  if (manual) {
    return (
      <div className="flex flex-col gap-2.5">
        <select
          aria-label="District"
          value={value.district}
          onChange={(e) => onChange({ town: value.town, district: e.target.value, custom: true })}
          className={inputClass(hasError && !value.district)}
        >
          <option value="" style={{ color: "#111", background: "#fff" }}>
            Select your district
          </option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d} style={{ color: "#111", background: "#fff" }}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="text"
          aria-label="Your town or city"
          placeholder="Type your town or city"
          value={value.town}
          maxLength={80}
          onChange={(e) => onChange({ town: e.target.value, district: value.district, custom: true })}
          className={inputClass(hasError && !value.town.trim())}
        />
        <button
          type="button"
          onClick={() => {
            setManual(false);
            setText("");
            onChange({ town: "", district: "", custom: false });
          }}
          className="self-start text-[12.5px] font-semibold text-accent-blue hover:opacity-75"
        >
          ← Back to the town list
        </button>
        <p className="text-[11.5px] text-[var(--ink-faint)]">
          Delivery is priced for your district&apos;s standard zone. We&apos;ll confirm your town when we pack your order.
        </p>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder="Type your town, district or postal code"
        value={text}
        onFocus={(e) => {
          setOpen(true);
          e.currentTarget.select();
        }}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
          if (value.town) onChange({ town: "", district: "", custom: false }); // typing invalidates the previous pick
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((a) => Math.min(a + 1, optionCount - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && open && text.trim()) {
            e.preventDefault();
            choose(active);
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
            setText(value.town);
          }
        }}
        className={inputClass(hasError)}
      />
      {value.town && !open && (
        <p className="mt-1 text-[11.5px] text-[var(--ink-faint)]">
          {value.town} — {value.district}
        </p>
      )}
      {open && text.trim() && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-card p-1 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)]"
        >
          {results.map((loc, i) => (
            <li
              key={`${loc.district}-${loc.town}-${loc.postalCode}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              ref={(el) => {
                if (el && i === active) el.scrollIntoView({ block: "nearest" });
              }}
              className={`flex cursor-pointer items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-[13.5px] ${
                i === active ? "bg-[var(--surface-tint-strong)]" : ""
              }`}
            >
              <span className="min-w-0 truncate">
                <span className="font-semibold text-[var(--ink)]">{loc.town}</span>
                <span className="text-[var(--ink-dim)]"> — {loc.district}</span>
              </span>
              {loc.postalCode && <span className="shrink-0 text-[11.5px] text-[var(--ink-faint)]">{loc.postalCode}</span>}
            </li>
          ))}
          <li
            id={`${listId}-${results.length}`}
            role="option"
            aria-selected={active === results.length}
            data-testid="town-not-listed"
            onMouseEnter={() => setActive(results.length)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(results.length)}
            className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold text-accent-blue ${
              active === results.length ? "bg-[var(--surface-tint-strong)]" : ""
            }`}
          >
            {results.length === 0 ? "No match — my town isn't listed" : "My town isn't listed"}
          </li>
        </ul>
      )}
    </div>
  );
}

