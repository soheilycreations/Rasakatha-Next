"use client";

import { useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/account";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Shown only when the Google provider is enabled in Supabase (see /api/auth/google).
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";

type Mode = "login" | "register" | "forgot";

export default function AuthModal({
  onClose,
  onAuthed,
}: {
  onClose: () => void;
  onAuthed: (account: Account) => void;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLFormElement>(null);
  // the parent passes a new onClose every render; keep the key handler stable
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Escape closes; Tab is trapped inside the dialog; focus returns to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setSent(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) setError(data.error || "Something went wrong");
        else setSent(true);
        return;
      }
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      onAuthed(data);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "forgot" ? "Reset your password" : mode === "login" ? "Sign in" : "Create account";

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="popover-in relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-card p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-[var(--ink-dim)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        {mode === "forgot" ? (
          <h2 className="mb-4 pr-8 font-display text-lg font-bold text-[var(--ink)]">Reset your password</h2>
        ) : (
          <div className="mb-5 mr-8 flex rounded-full bg-[var(--surface-tint)] p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-colors ${
                  mode === m ? "bg-accent text-white" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>
        )}

        {mode === "forgot" && sent ? (
          <p role="status" className="text-[13.5px] text-[var(--ink-dim)]">
            If an account exists for <b>{email}</b>, we&apos;ve emailed a link to reset your password.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {mode === "forgot" && (
              <p className="text-[13px] text-[var(--ink-dim)]">Enter your email and we&apos;ll send you a reset link.</p>
            )}
            {mode === "register" && (
              <>
                <input className={inputClass} aria-label="Full name" autoComplete="name" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={inputClass} aria-label="Phone number (optional)" autoComplete="tel" placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </>
            )}
            <input
              className={inputClass}
              type="email"
              aria-label="Email address"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            {mode !== "forgot" && (
              <div className="relative">
                <input
                  className={`${inputClass} pr-16`}
                  type={showPassword ? "text" : "password"}
                  aria-label="Password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  placeholder={mode === "register" ? "Password (min. 8 characters)" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            )}
            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="self-end text-[12.5px] font-semibold text-accent hover:underline"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-[12.5px] text-accent">
            {error}
          </p>
        )}

        {!(mode === "forgot" && sent) && (
          <button
            type="submit"
            disabled={loading}
            className="btn-accent mt-5 w-full rounded-full py-3 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "forgot" ? "Send reset link" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        )}

        {GOOGLE_ENABLED && mode !== "forgot" && (
          <>
            <div className="my-4 flex items-center gap-3 text-[11.5px] text-[var(--ink-faint)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              or
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>
            <a
              href="/api/auth/google"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] py-2.5 text-[13.5px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-tint)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
                <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.1-4.5H2.3v2.8A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.9 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.3a11 11 0 0 0 0 9.9l3.6-2.8z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.3 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
              </svg>
              Continue with Google
            </a>
          </>
        )}

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="mt-4 w-full text-center text-[12.5px] font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]"
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
