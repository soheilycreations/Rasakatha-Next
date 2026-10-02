"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/lib/links";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors";

export default function ResetPasswordForm() {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase puts the recovery token in the URL hash; read it once, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const t = params.get("access_token");
    if (t) history.replaceState(null, "", window.location.pathname);
    queueMicrotask(() => setToken(t));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Something went wrong");
      else setDone(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Reset your password</h1>
      {token === undefined ? null : done ? (
        <div className="mt-4">
          <p className="text-[14px] text-[var(--ink-dim)]">Your password has been updated. You can now sign in with it.</p>
          <Link href={ROUTES.home} className="btn-accent mt-5 inline-block rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
            Back to the store
          </Link>
        </div>
      ) : !token ? (
        <p className="mt-4 text-[14px] text-[var(--ink-dim)]">
          This page needs the link from your password-reset email. Use “Forgot password?” in the sign-in window to get a new one.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label htmlFor="new-password" className="text-[13px] font-semibold text-[var(--ink-dim)]">
            New password (min. 8 characters)
          </label>
          <div className="relative">
            <input
              id="new-password"
              className={`${inputClass} pr-16`}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-[12.5px] text-accent">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-accent mt-2 rounded-full py-3 text-[13.5px] font-bold text-white disabled:opacity-60">
            {loading ? "Please wait…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}
