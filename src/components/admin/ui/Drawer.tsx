"use client";

import { useRef } from "react";
import { useFocusTrap } from "./useFocusTrap";
import IconButton from "./IconButton";

// Slide-over panel for row details (instead of reflowing a table row). Esc / backdrop / close button dismiss it.
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[65] flex justify-end bg-black/50" onMouseDown={onClose}>
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex h-full w-full ${width} flex-col border-l border-[var(--border)] bg-card shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.6)]`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-bold text-[var(--ink)]">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-[var(--ink-dim)]">{subtitle}</p>}
          </div>
          <IconButton label="Close panel" onClick={onClose} className="-mr-2">
            <span aria-hidden>✕</span>
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] px-6 py-4">{footer}</div>}
      </aside>
    </div>
  );
}
