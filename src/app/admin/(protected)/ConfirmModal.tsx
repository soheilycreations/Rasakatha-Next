"use client";

export default function ConfirmModal({
  title,
  description,
  confirmLabel = "Delete",
  onCancel,
  onConfirm,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-bold text-[var(--ink)]">{title}</h3>
        {description && <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-[13px] font-semibold text-[var(--ink-dim)] hover:bg-[var(--surface-tint)]">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-full bg-accent px-5 py-2 text-[13px] font-bold text-white hover:opacity-90">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
