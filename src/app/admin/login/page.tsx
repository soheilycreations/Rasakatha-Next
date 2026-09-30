"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-card p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="mx-auto mb-5 flex items-center justify-center">
          <Image src={logoLight} alt="Rasakatha.lk" className="logo-light h-11 w-auto" priority />
          <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-14 w-auto" priority />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-[var(--ink)]">Rasakatha Admin</h1>
        <p className="mt-1 text-center text-[13px] text-[var(--ink-faint)]">Sign in to manage your store.</p>

        <div className="mt-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50"
          />
          {error && <p className="mt-2 text-[12.5px] text-accent">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-accent mt-5 w-full rounded-full py-3 text-[13.5px] font-bold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
