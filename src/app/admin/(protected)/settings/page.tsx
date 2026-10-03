"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Input, Textarea, useToast } from "@/components/admin/ui";
import { ROLES, ROLE_LABELS } from "@/lib/permissions";
import { settingsSchema, type Settings } from "@/lib/schemas/admin";

const num = (v: string) => (v === "" ? 0 : Number(v));

function Section({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-card p-6">
      <h2 className="text-[15px] font-bold text-[var(--ink)]">{title}</h2>
      {hint && <p className="mt-1 text-[12.5px] text-[var(--ink-dim)]">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((r) => r.json()).then(setS);
    fetch("/api/admin/me").then((r) => r.json()).then((m: { permissions: string[] }) => setCanEdit(m.permissions.includes("settings.edit")));
  }, []);

  if (!s) return <p className="text-[13px] text-[var(--ink-dim)]">Loading…</p>;
  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });
  const ro = !canEdit;

  const save = async () => {
    const parsed = settingsSchema.safeParse(s);
    if (!parsed.success) return setError(`${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}`);
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    setSaving(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error || "Couldn't save");
    toast("Settings saved");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Settings</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">Used on receipts, invoices and in the till. {ro && <Badge tone="warning">View only: the owner edits settings</Badge>}</p>
        </div>
        {!ro && (
          <Button variant="primary" onClick={save} loading={saving}>
            Save settings
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-[13px] text-[var(--ink)]">
          {error}
        </p>
      )}

      <fieldset disabled={ro} className="contents">
        <Section title="Store">
          <Input label="Store name" value={s.store.name} onChange={(e) => set({ store: { ...s.store, name: e.target.value } })} />
          <Input label="Phone" value={s.store.phone} onChange={(e) => set({ store: { ...s.store, phone: e.target.value } })} />
          <Input label="Email" value={s.store.email} onChange={(e) => set({ store: { ...s.store, email: e.target.value } })} />
          <Input label="Address" value={s.store.address} onChange={(e) => set({ store: { ...s.store, address: e.target.value } })} />
        </Section>

        <Section title="Receipts" hint="Printed on the 80 mm receipt and the A4 invoice.">
          <Textarea label="Header" rows={3} value={s.receipt.header} onChange={(e) => set({ receipt: { ...s.receipt, header: e.target.value } })} />
          <Textarea label="Footer" rows={3} value={s.receipt.footer} onChange={(e) => set({ receipt: { ...s.receipt, footer: e.target.value } })} />
        </Section>

        <Section title="Tax / VAT" hint="Off by default. Turn on only if the business charges VAT.">
          <label className="flex min-h-11 items-center gap-3 text-[13.5px] font-semibold text-[var(--ink)]">
            <input type="checkbox" checked={s.tax.enabled} onChange={(e) => set({ tax: { ...s.tax, enabled: e.target.checked } })} className="h-5 w-5 accent-accent" />
            Charge tax on sales
          </label>
          <Input label="Tax label" value={s.tax.label} onChange={(e) => set({ tax: { ...s.tax, label: e.target.value } })} />
          <Input label="Tax rate (%)" type="number" min={0} max={100} step="0.01" value={s.tax.rate} onChange={(e) => set({ tax: { ...s.tax, rate: num(e.target.value) } })} />
        </Section>

        <Section title="Discount limits (% per role)" hint="A cashier cannot give a discount above their limit without a manager.">
          {ROLES.map((r) => (
            <Input key={r} label={ROLE_LABELS[r]} type="number" min={0} max={100} value={s.discountLimits[r]} onChange={(e) => set({ discountLimits: { ...s.discountLimits, [r]: num(e.target.value) } })} />
          ))}
        </Section>

        <Section title="Stock and money defaults">
          <Input label="Low-stock threshold (copies)" type="number" min={0} value={s.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: num(e.target.value) })} />
          <Input label="Credit terms (days)" type="number" min={0} max={365} value={s.creditTermsDays} onChange={(e) => set({ creditTermsDays: num(e.target.value) })} hint="Default payment terms for schools and libraries." />
          <Input label="Default author royalty (%)" type="number" min={0} max={100} step="0.01" value={s.defaults.royaltyPercent} onChange={(e) => set({ defaults: { ...s.defaults, royaltyPercent: num(e.target.value) } })} hint="CONFIRM: starting value for new royalty contracts." />
          <Input label="Consignment payable (% of selling price)" type="number" min={0} max={100} step="0.01" value={s.defaults.consignmentPayablePercent} onChange={(e) => set({ defaults: { ...s.defaults, consignmentPayablePercent: num(e.target.value) } })} hint="CONFIRM: what you pay a consignor per copy sold." />
        </Section>

        <section className="rounded-2xl border border-[var(--border)] bg-card p-6">
          <h2 className="text-[15px] font-bold text-[var(--ink)]">Couriers</h2>
          <p className="mt-1 text-[12.5px] text-[var(--ink-dim)]">Used when shipping web orders. The tracking link may contain {"{tracking}"} where the number goes.</p>
          <div className="mt-4 flex flex-col gap-3">
            {s.couriers.map((c, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
                <Input label="Courier name" value={c.name} onChange={(e) => set({ couriers: s.couriers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <Input label="Tracking link" value={c.trackingUrl} onChange={(e) => set({ couriers: s.couriers.map((x, j) => (j === i ? { ...x, trackingUrl: e.target.value } : x)) })} />
                <Button variant="ghost" onClick={() => set({ couriers: s.couriers.filter((_, j) => j !== i) })}>
                  Remove
                </Button>
              </div>
            ))}
            {!ro && (
              <Button variant="secondary" className="self-start" onClick={() => set({ couriers: [...s.couriers, { name: "", trackingUrl: "" }] })}>
                + Add courier
              </Button>
            )}
            {ro && s.couriers.length === 0 && <p className="text-[13px] text-[var(--ink-dim)]">No couriers added yet.</p>}
          </div>
        </section>
      </fieldset>
    </div>
  );
}
