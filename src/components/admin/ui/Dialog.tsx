"use client";

import { useRef } from "react";
import { useFocusTrap } from "./useFocusTrap";
import IconButton from "./IconButton";
import Button from "./Button";

// Centered modal. Esc and the close button dismiss it; Tab stays inside.
export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  const width = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" onMouseDown={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[90vh] w-full ${width} flex-col rounded-2xl border border-[var(--border)] bg-card shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]`}
      >
        <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--ink)]">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-[var(--ink-dim)]">{description}</p>}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
            <span aria-hidden>✕</span>
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// A confirm dialog built on Dialog (replaces the old ConfirmModal).
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  danger,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
