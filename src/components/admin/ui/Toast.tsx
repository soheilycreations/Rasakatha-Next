"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

// Toasts with an optional Undo. Wrap the admin in <ToastProvider> and call useToast().
type ToastItem = { id: number; message: string; tone: "info" | "error"; undo?: () => void };
type Api = { toast: (message: string, opts?: { undo?: () => void; tone?: "info" | "error"; ms?: number }) => void };

const ToastContext = createContext<Api | null>(null);

export function useToast(): Api {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const toast = useCallback<Api["toast"]>(
    (message, opts) => {
      const id = next.current++;
      setItems((l) => [...l.slice(-3), { id, message, tone: opts?.tone ?? "info", undo: opts?.undo }]);
      setTimeout(() => dismiss(id), opts?.ms ?? (opts?.undo ? 7000 : 3500));
    },
    [dismiss]
  );
  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-center gap-3 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-lg ${
              t.tone === "error" ? "bg-accent text-white" : "bg-[var(--ink)] text-[var(--bg)]"
            }`}
          >
            {t.message}
            {t.undo && (
              <button
                type="button"
                onClick={() => {
                  t.undo?.();
                  dismiss(t.id);
                }}
                className="rounded-full px-2 py-0.5 font-bold underline underline-offset-2"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
