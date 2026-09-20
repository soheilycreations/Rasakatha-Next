"use client";

import { useState } from "react";
import type { Account } from "@/lib/account";

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors";

export default function AuthModal({
  onClose,
  onAuthed,
}: {
  onClose: () => void;
  onAuthed: (account: Account) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
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

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="popover-in w-full max-w-sm rounded-2xl border border-[var(--border)] bg-card p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        <div className="mb-5 flex rounded-full bg-[var(--surface-tint)] p-1">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              className={`flex-1 rounded-full py-2 text-[13px] font-bold transition-colors ${
                mode === m ? "bg-accent text-white" : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {mode === "register" && (
            <>
              <input className={inputClass} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={inputClass} placeholder="Phone number (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </>
          )}
          <input className={inputClass} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <input
            className={inputClass}
            type="password"
            placeholder={mode === "register" ? "Password (min. 8 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-[12.5px] text-accent">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-accent mt-5 w-full rounded-full py-3 text-[13.5px] font-bold text-white disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
