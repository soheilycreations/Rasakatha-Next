"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog } from "@/components/admin/ui";

type Person = { id: string; name: string; role: string };

// Fast cashier switching: pick a name, enter the 4-6 digit PIN. Only cashier / stock-keeper accounts
// that have a PIN are listed; owners and managers always sign in with password + 2FA.
export default function SwitchUser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [people, setPeople] = useState<Person[] | null>(null);
  const [picked, setPicked] = useState<Person | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setPicked(null);
      setPin("");
      setError("");
    });
    fetch("/api/admin/pin")
      .then((r) => r.json())
      .then((d: { staff?: Person[] }) => setPeople(d.staff ?? []))
      .catch(() => setPeople([]));
  }, [open]);

  const submit = async (value: string) => {
    if (!picked || value.length < 4) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staffId: picked.id, pin: value }) });
    setBusy(false);
    if (!res.ok) {
      setPin("");
      setError((await res.json().catch(() => ({}))).error || "Wrong PIN");
      return;
    }
    onClose();
    router.push("/admin/pos");
    router.refresh();
  };

  const press = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) void submit(next);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Switch user" description={picked ? `Enter ${picked.name}'s PIN` : "Who is taking over the till?"} size="sm">
      {!picked ? (
        <div className="flex flex-col gap-2">
          {people === null && <p className="text-[13px] text-[var(--ink-dim)]">Loading…</p>}
          {people?.length === 0 && <p className="text-[13px] text-[var(--ink-dim)]">No cashier has a PIN yet. The owner can set one in Staff.</p>}
          {people?.map((p) => (
            <Button key={p.id} variant="secondary" onClick={() => setPicked(p)} className="justify-start">
              {p.name}
              <span className="ml-auto text-[11px] font-normal text-[var(--ink-faint)]">{p.role === "stock" ? "Stock keeper" : "Cashier"}</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div aria-label={`${pin.length} digits entered`} className="flex h-6 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={`h-3 w-3 rounded-full ${i < pin.length ? "bg-accent" : "bg-[var(--surface-tint-strong)]"}`} />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-[12.5px] text-accent">
              {error}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <Button key={d} onClick={() => press(d)} className="h-14 w-16 text-lg" disabled={busy}>
                {d}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setPin((p) => p.slice(0, -1))} className="h-14 w-16" aria-label="Delete last digit">
              ⌫
            </Button>
            <Button onClick={() => press("0")} className="h-14 w-16 text-lg" disabled={busy}>
              0
            </Button>
            <Button variant="primary" onClick={() => void submit(pin)} className="h-14 w-16" disabled={busy || pin.length < 4} aria-label="Unlock">
              ✓
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
            ← Someone else
          </Button>
        </div>
      )}
    </Dialog>
  );
}
