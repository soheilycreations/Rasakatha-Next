"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";
import { Button, Input } from "@/components/admin/ui";
import { loginSchema, totpCodeSchema } from "@/lib/schemas/admin";

type Step = "credentials" | "totp" | "emergency";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<{ staffReady: boolean; emergencyAllowed: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((o: { staffReady: boolean; emergencyAllowed: boolean }) => {
        setOptions(o);
        // before any staff account exists the only way in is the emergency password
        if (!o.staffReady && o.emergencyAllowed) setStep("emergency");
      })
      .catch(() => setOptions({ staffReady: true, emergencyAllowed: false }));
  }, []);

  const post = async (url: string, body: unknown) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        return null;
      }
      return data as { step: string; ticket?: string; redirect?: string };
    } catch {
      setError("Something went wrong. Try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const finish = (data: { redirect?: string }) => {
    router.push(data.redirect || "/admin");
    router.refresh();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "credentials") {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter your email and password");
      const data = await post("/api/admin/login", parsed.data);
      if (!data) return;
      if (data.step === "totp" && data.ticket) {
        setTicket(data.ticket);
        setStep("totp");
      } else finish(data);
    } else if (step === "totp") {
      const parsed = totpCodeSchema.safeParse(code);
      if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code");
      const data = await post("/api/admin/login/totp", { ticket, code: parsed.data });
      if (data) finish(data);
    } else {
      const data = await post("/api/admin/login", { password });
      if (data) finish(data);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-card p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
        <div className="mx-auto mb-5 flex items-center justify-center">
          <Image src={logoLight} alt="Rasakatha.lk" className="logo-light h-11 w-auto" priority />
          <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-14 w-auto" priority />
        </div>
        <h1 className="text-center font-display text-xl font-bold text-[var(--ink)]">Rasakatha Admin</h1>
        <p className="mt-1 text-center text-[13px] text-[var(--ink-dim)]">
          {step === "totp" ? "Enter the code from your authenticator app." : step === "emergency" ? "Emergency owner sign-in." : "Sign in to manage your store."}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {step === "credentials" && (
            <>
              <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          )}
          {step === "totp" && (
            <Input label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
          )}
          {step === "emergency" && (
            <Input label="Emergency password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus hint="Only works while the emergency login is enabled." />
          )}
          {error && (
            <p role="alert" className="text-[12.5px] text-accent">
              {error}
            </p>
          )}
        </div>

        <Button type="submit" variant="primary" loading={loading} className="mt-5 w-full">
          {loading ? "Signing in…" : step === "totp" ? "Verify" : "Sign In"}
        </Button>

        {step !== "credentials" && options?.staffReady && (
          <button type="button" onClick={() => { setStep("credentials"); setError(""); setCode(""); }} className="mt-3 w-full text-center text-[12.5px] font-semibold text-[var(--ink-dim)] hover:text-[var(--ink)]">
            ← Back to email sign-in
          </button>
        )}
        {step === "credentials" && options?.emergencyAllowed && (
          <button type="button" onClick={() => { setStep("emergency"); setError(""); }} className="mt-3 w-full text-center text-[12.5px] font-semibold text-[var(--ink-faint)] hover:text-[var(--ink-dim)]">
            Use the emergency owner password
          </button>
        )}
      </form>
    </div>
  );
}
