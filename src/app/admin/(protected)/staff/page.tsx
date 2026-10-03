"use client";

import { useEffect, useState } from "react";
import { Badge, Button, DataTable, Dialog, Input, Select, useToast, type Column } from "@/components/admin/ui";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";
import { staffCreateSchema } from "@/lib/schemas/admin";

type Staff = { id: string; email: string; fullName: string; role: Role; active: boolean; hasPin: boolean; totpEnabled: boolean; recoveryCodesLeft: number; lastLoginAt: string | null };

export default function StaffPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState({ email: "", fullName: "", role: "cashier" as Role, password: "", pin: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pw, setPw] = useState("");
  const [pin, setPin] = useState("");

  const load = () =>
    fetch("/api/admin/staff")
      .then((r) => r.json())
      .then((d: { items: Staff[]; tableMissing?: boolean }) => {
        setItems(d.items ?? []);
        setTableMissing(!!d.tableMissing);
        setLoading(false);
      });
  useEffect(() => {
    load();
  }, []);

  const patch = async (body: object, ok: string) => {
    const res = await fetch("/api/admin/staff", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast(data.error || "Couldn't save", { tone: "error" });
    toast(ok);
    await load();
    return true;
  };

  const create = async () => {
    const parsed = staffCreateSchema.safeParse({ ...form, pin: form.pin || undefined });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (e[String(i.path[0])] ??= i.message));
      return setErrors(e);
    }
    const res = await fetch("/api/admin/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErrors({ email: data.error || "Couldn't create the account" });
    toast(`Created ${form.fullName}`);
    setAdding(false);
    setForm({ email: "", fullName: "", role: "cashier", password: "", pin: "" });
    setErrors({});
    load();
  };

  const columns: Column<Staff>[] = [
    { key: "name", header: "Name", sortValue: (s) => s.fullName.toLowerCase(), cell: (s) => (<div><div className="truncate font-semibold">{s.fullName}</div><div className="truncate text-[12px] text-[var(--ink-dim)]">{s.email}</div></div>) },
    { key: "role", header: "Role", width: "130px", sortValue: (s) => s.role, cell: (s) => <Badge tone={s.role === "owner" ? "accent" : "neutral"}>{ROLE_LABELS[s.role]}</Badge> },
    { key: "status", header: "Status", width: "110px", sortValue: (s) => Number(s.active), cell: (s) => <Badge tone={s.active ? "success" : "warning"}>{s.active ? "Active" : "Deactivated"}</Badge> },
    { key: "2fa", header: "2FA", width: "90px", hideBelow: "md", cell: (s) => (s.totpEnabled ? "On" : s.role === "owner" || s.role === "manager" ? "Not yet" : "n/a") },
    { key: "recovery", header: "Recovery codes", width: "130px", hideBelow: "lg", hiddenByDefault: true, cell: (s) => (s.totpEnabled ? `${s.recoveryCodesLeft} left` : "-") },
    { key: "pin", header: "PIN", width: "80px", hideBelow: "md", cell: (s) => (s.hasPin ? "Set" : "-") },
    { key: "last", header: "Last sign-in", width: "150px", hideBelow: "lg", sortValue: (s) => s.lastLoginAt ?? "", cell: (s) => (s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("en-GB") : "Never") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Staff</h1>
          <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">Accounts, roles, till PINs and two-factor. Everything here is recorded in the audit log.</p>
        </div>
        <Button variant="primary" onClick={() => setAdding(true)}>
          + Add staff
        </Button>
      </div>

      {tableMissing && (
        <p role="alert" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-[13px] text-[var(--ink)]">
          The staff table doesn&apos;t exist yet. Run <code>supabase/admin-phase-0.sql</code> in the Supabase SQL Editor, then <code>scripts/create-owner.mjs</code>.
        </p>
      )}

      <DataTable columns={columns} rows={items} rowKey={(s) => s.id} loading={loading} caption="Staff" onRowClick={(s) => { setEditing(s); setPw(""); setPin(""); }} filterText={(s) => `${s.fullName} ${s.email} ${s.role}`} filterLabel="Find a staff member" storageKey="staff" />

      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Add a staff member"
        footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button variant="primary" onClick={create}>Create account</Button></>}
      >
        <div className="flex flex-col gap-4">
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => (<option key={r} value={r}>{ROLE_LABELS[r]}</option>))}
          </Select>
          <Input label="Temporary password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} hint="At least 10 characters. They can change it under My account." />
          {(form.role === "cashier" || form.role === "stock") && (
            <Input label="Till PIN (optional)" inputMode="numeric" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} error={errors.pin} hint="4-6 digits, for quick user switching at the till." />
          )}
        </div>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing?.fullName ?? ""} description={editing?.email} size="md" footer={<Button variant="ghost" onClick={() => setEditing(null)}>Close</Button>}>
        {editing && (
          <div className="flex flex-col gap-5">
            <Select label="Role" value={editing.role} onChange={async (e) => { if (await patch({ id: editing.id, role: e.target.value }, "Role updated")) setEditing({ ...editing, role: e.target.value as Role }); }}>
              {ROLES.map((r) => (<option key={r} value={r}>{ROLE_LABELS[r]}</option>))}
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button variant={editing.active ? "danger" : "primary"} onClick={async () => { if (await patch({ id: editing.id, active: !editing.active }, editing.active ? "Deactivated" : "Reactivated")) setEditing({ ...editing, active: !editing.active }); }}>
                {editing.active ? "Deactivate account" : "Reactivate account"}
              </Button>
              {editing.totpEnabled && (
                <Button onClick={async () => { if (window.confirm(`Reset two-factor for ${editing.fullName}? Their authenticator and recovery codes stop working and they set it up again at the next sign-in. This is recorded in the audit log.`) && (await patch({ id: editing.id, resetTotp: true }, "Two-factor reset: they set it up again at next sign-in"))) setEditing({ ...editing, totpEnabled: false, recoveryCodesLeft: 0 }); }}>
                  Reset two-factor (lost phone)
                </Button>
              )}
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1"><Input label="Set a new password" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} hint="At least 10 characters." /></div>
              <Button disabled={pw.length < 10} onClick={async () => { if (await patch({ id: editing.id, password: pw }, "Password reset")) setPw(""); }}>Reset</Button>
            </div>
            {(editing.role === "cashier" || editing.role === "stock") && (
              <div className="flex items-end gap-2">
                <div className="flex-1"><Input label={editing.hasPin ? "Change PIN" : "Set PIN"} inputMode="numeric" maxLength={6} type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} /></div>
                <Button disabled={pin.length < 4} onClick={async () => { if (await patch({ id: editing.id, pin }, "PIN saved")) { setPin(""); setEditing({ ...editing, hasPin: true }); } }}>Save</Button>
                {editing.hasPin && <Button variant="ghost" onClick={async () => { if (await patch({ id: editing.id, pin: null }, "PIN removed")) setEditing({ ...editing, hasPin: false }); }}>Remove</Button>}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
