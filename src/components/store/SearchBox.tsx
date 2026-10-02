"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Suggestions } from "@/lib/catalog";
import { tintForId } from "@/lib/format";
import BookCover from "./BookCover";
import { IconSearch } from "./icons";

type Option =
  | { kind: "book"; id: string; title: string; author: string; cover: string | null }
  | { kind: "author"; name: string; count: number }
  | { kind: "all"; q: string };

export default function SearchBox({
  onSubmit,
  onOpenBook,
  onOpenAuthor,
}: {
  onSubmit: (q: string) => void;
  onOpenBook: (book: { id: string; title: string }) => void;
  onOpenAuthor: (name: string) => void;
}) {
  const pathname = usePathname();
  const listId = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Suggestions | null>(null);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLFormElement>(null);

  // On /search keep the box in sync with ?q=; anywhere else leaving a page clears it.
  useEffect(() => {
    const q = pathname === "/search" ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
    queueMicrotask(() => {
      setValue(q);
      setOpen(false);
    });
  }, [pathname]);

  // Debounced, cancellable fetch of suggestions.
  const q = value.trim();
  useEffect(() => {
    if (q.length < 2) {
      queueMicrotask(() => setData(null));
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: Suggestions) => {
          setData(d);
          setActive(-1);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const options: Option[] =
    q.length >= 2 && data
      ? [
          ...data.books.map((b) => ({ kind: "book" as const, ...b })),
          ...data.authors.map((a) => ({ kind: "author" as const, ...a })),
          { kind: "all" as const, q },
        ]
      : [];
  const showList = open && options.length > 0;

  const choose = (o: Option) => {
    setOpen(false);
    if (o.kind === "book") onOpenBook({ id: o.id, title: o.title });
    else if (o.kind === "author") onOpenAuthor(o.name);
    else onSubmit(o.q);
  };

  const move = (dir: 1 | -1) => {
    setOpen(true);
    // -1 means "nothing highlighted", so cycle through -1..n-1
    setActive((a) => {
      const n = options.length;
      const next = a + dir;
      if (next < -1) return n - 1;
      if (next >= n) return -1;
      return next;
    });
  };

  return (
    <form
      ref={wrapRef}
      role="search"
      className="relative min-w-0 max-w-[640px] flex-1 sm:flex-[3]"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && options[active]) return choose(options[active]);
        if (q) {
          setOpen(false);
          onSubmit(q);
        }
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-tint)] py-[7px] pl-3.5 pr-[7px] backdrop-blur-md sm:pl-[18px] transition-colors focus-within:border-accent/50 focus-within:bg-[var(--surface-tint-strong)]">
        <IconSearch className="shrink-0 text-[var(--ink-faint)]" />
        <input
          type="search"
          enterKeyHint="search"
          role="combobox"
          aria-label="Search books and authors"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Escape") {
              if (showList) setOpen(false);
              else setValue("");
            }
          }}
          placeholder="Search books, authors…"
          className="min-w-0 flex-1 bg-transparent py-1 font-sans text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none sm:text-base"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[var(--surface-tint-strong)] text-[15px] leading-none text-[var(--ink-dim)] transition-colors hover:text-[var(--ink)]"
          >
            ×
          </button>
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-card p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
        >
          {options.map((o, i) => (
            <li
              key={o.kind + (o.kind === "book" ? o.id : o.kind === "author" ? o.name : "all")}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] ${
                i === active ? "bg-[var(--surface-tint-strong)]" : ""
              }`}
            >
              {o.kind === "book" && (
                <>
                  <BookCover
                    cover={o.cover ?? undefined}
                    tint={tintForId(o.id)}
                    alt=""
                    className="h-[46px] w-[32px] shrink-0 rounded"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-[var(--ink)]">{o.title}</span>
                    <span className="block truncate text-[12px] text-[var(--ink-dim)]">{o.author}</span>
                  </span>
                </>
              )}
              {o.kind === "author" && (
                <span className="text-[var(--ink)]">
                  <span className="mr-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-dim)]">Author</span>
                  {o.name} <span className="text-[var(--ink-dim)]">· {o.count} books</span>
                </span>
              )}
              {o.kind === "all" && (
                <span className="font-semibold text-accent">See all results for &ldquo;{o.q}&rdquo;</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
