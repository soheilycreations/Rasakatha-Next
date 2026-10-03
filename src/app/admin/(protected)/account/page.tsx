"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Input, useToast } from "@/components/admin/ui";
import { passwordSchema, pinSchema, totpCodeSchema } from "@/lib/schemas/admin";

type Me = { id: string; name: string; role: string; emergency: boolean; twoFactorDone: boolean; totpEnabled: boolean; hasPin: boolean };

async function call(body: object) {
  const res = await fetch("/api/admin/account/security", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forced, setForced] = useState(false);

  const load = () =>
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((m: Me) => setMe(m));

  useEffect(() => {
    load();
    queueMicrotask(() => setForced(new URLSearchParams(window.location.search).get("setup") === "1"));
  }, []);

  if (!me) return <p className="text-[13px] text-[var(--ink-dim)]">Loading…</p>;
  const mustHave2fa = me.role === "owner" || me.role === "manager";

  const startTotp = async () => {
    const { ok, data } = await call({ action: "totp-start" });
    if (!ok) return toast(data.error || "Couldn't start setup", { tone: "error" });
    setSetup({ qr: data.qr, secret: data.secret });
  };
  const confirmTotp = async () => {
    const parsed = totpCodeSchema.safeParse(code);
    if (!parsed.success) return setErrors({ code: parsed.error.issues[0].message });
    const { ok, data } = await call({ action: "totp-confirm", code: parsed.data });
    if (!ok) return setErrors({ code: data.error || "Wrong code" });
    setErrors({});
    setSetup(null);
    setCode("");
    toast("Two-factor authentication is on");
    await load();
    router.refresh();
    if (forced) router.push("/admin");
  };
  const savePin = async () => {
    const parsed = pinSchema.safeParse(pin);
    if (!parsed.success) return setErrors({ pin: parsed.error.issues[0].message });
    const { ok, data } = await call({ action: "set-pin", pin: parsed.data });
    if (!ok) return setErrors({ pin: data.error || "Couldn't save the PIN" });
    setErrors({});
    setPin("");
    toast("PIN saved");
    load();
  };
  const changePassword = async () => {
    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) return setErrors({ next: parsed.error.issues[0].message });
    const { ok, data } = await call({ action: "change-password", currentPassword: current, newPassword: parsed.data });
    if (!ok) return setErrors({ current: data.error || "Couldn't change the password" });
    setErrors({});
    setCurrent("");
    setNext("");
    toast("Password changed");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">My account &amp; security</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">
          {me.name} · <Badge>{me.role}</Badge>
        </p>
      </div>

      {me.emergency && <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[13px] text-[var(--ink)]">You are signed in with the emergency owner login, which has no personal settings. Sign in with your staff account to manage two-factor, PIN and password.</p>}

      {!me.emergency && (
        <>
          {forced && !me.twoFactorDone && (
            <p role="alert" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-[13px] text-[var(--ink)]">
              Owners and managers must turn on two-factor authentication before using the admin. It takes a minute.
            </p>
          )}

          <section className="rounded-2xl border border-[var(--border)] bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold text-[var(--ink)]">Two-factor authentication (authenticator app)</h2>
              <Badge tone={me.totpEnabled ? "success" : mustHave2fa ? "accent" : "neutral"}>{me.totpEnabled ? "On" : mustHave2fa ? "Required" : "Off"}</Badge>
            </div>
            <p className="mt-1.5 text-[13px] text-[var(--ink-dim)]">Use Google Authenticator, Authy, 1Password or similar. {mustHave2fa ? "Required for your role." : "Optional for your role."}</p>
            {!setup ? (
              <Button className="mt-4" variant={me.totpEnabled ? "secondary" : "primary"} onClick={startTotp}>
                {me.totpEnabled ? "Set up again (new phone)" : "Set up two-factor"}
              </Button>
            ) : (
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setup.qr} alt="QR code for your authenticator app" width={176} height={176} className="rounded-xl bg-white p-2" />
                <div className="flex flex-1 flex-col gap-3">
                  <p className="text-[13px] text-[var(--ink-dim)]">Scan the code, or enter this key by hand: <code className="break-all font-mono text-[12px] text-[var(--ink)]">{setup.secret}</code></p>
                  <Input label="6-digit code from the app" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} error={errors.code} />
                  <Button variant="primary" onClick={confirmTotp}>
                    Turn on
                  </Button>
                </div>
              </div>
            )}
          </section>

          {(me.role === "cashier" || me.role === "stock") && (
            <section className="rounded-2xl border border-[var(--border)] bg-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-[var(--ink)]">Till PIN</h2>
                <Badge tone={me.hasPin ? "success" : "neutral"}>{me.hasPin ? "Set" : "Not set"}</Badge>
              </div>
              <p className="mt-1.5 text-[13px] text-[var(--ink-dim)]">A 4-6 digit PIN lets you take over the till quickly with &ldquo;Switch user&rdquo;.</p>
              <div className="mt-4 flex max-w-xs flex-col gap-3">
                <Input label="New PIN (4-6 digits)" inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} error={errors.pin} />
                <Button onClick={savePin}>Save PIN</Button>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-[var(--border)] bg-card p-6">
            <h2 className="text-[15px] font-bold text-[var(--ink)]">Change password</h2>
            <div className="mt-4 flex max-w-xs flex-col gap-3">
              <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.current} />
              <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.next} hint="At least 10 characters." />
              <Button onClick={changePassword}>Change password</Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
