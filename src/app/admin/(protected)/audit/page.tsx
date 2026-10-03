"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, DataTable, Drawer, Input, Select, type Column } from "@/components/admin/ui";

type Row = {
  id: number;
  at: string;
  actor_name: string;
  actor_role: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  note: string | null;
};

const ENTITIES = ["book", "order", "pos_sale", "staff", "settings", "category", "author", "hero_slide", "review"];

export default function AuditPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<Row | null>(null);

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: "50" });
    if (actor.trim()) p.set("actor", actor.trim());
    if (entity) p.set("entity", entity);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    setLoading(true);
    fetch(`/api/admin/audit?${p}`)
      .then((r) => r.json())
      .then((d: { items: Row[]; total: number; pageCount: number; tableMissing?: boolean }) => {
        setRows(d.items ?? []);
        setTotal(d.total ?? 0);
        setPageCount(d.pageCount ?? 1);
        setTableMissing(!!d.tableMissing);
        setLoading(false);
      });
  }, [page, actor, entity, from, to]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce the actor text box
    return () => clearTimeout(t);
  }, [load]);

  const columns: Column<Row>[] = [
    { key: "at", header: "When", width: "170px", sortValue: (r) => r.at, cell: (r) => new Date(r.at).toLocaleString("en-GB") },
    { key: "actor", header: "Who", width: "190px", sortValue: (r) => r.actor_name, cell: (r) => (<div className="truncate"><span className="font-semibold">{r.actor_name}</span>{r.actor_role && <span className="ml-1.5 text-[11.5px] text-[var(--ink-faint)]">{r.actor_role}</span>}</div>) },
    { key: "action", header: "Action", sortValue: (r) => r.action, cell: (r) => <Badge tone={r.action.includes("delete") || r.action.includes("archive") || r.action.includes("failed") ? "accent" : "neutral"}>{r.action}</Badge> },
    { key: "entity", header: "What", cell: (r) => (<span className="truncate">{r.entity}{r.entity_id ? ` · ${r.entity_id}` : ""}</span>) },
    { key: "note", header: "Note", hideBelow: "lg", cell: (r) => <span className="truncate text-[var(--ink-dim)]">{r.note ?? ""}</span> },
  ];

  const json = (v: unknown) => (v == null ? "-" : JSON.stringify(v, null, 2));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Audit log</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">Every change to books, orders, staff and settings, with who did it. Entries can&apos;t be edited or deleted. {total.toLocaleString()} entries match.</p>
      </div>

      {tableMissing && (
        <p role="alert" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-[13px] text-[var(--ink)]">
          The audit table doesn&apos;t exist yet. Run <code>supabase/admin-phase-0.sql</code> in the Supabase SQL Editor.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="User" value={actor} onChange={(e) => { setPage(1); setActor(e.target.value); }} placeholder="Name" />
        <Select label="What" value={entity} onChange={(e) => { setPage(1); setEntity(e.target.value); }}>
          <option value="">Everything</option>
          {ENTITIES.map((e) => (<option key={e} value={e}>{e}</option>))}
        </Select>
        <Input label="From" type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
        <Input label="To" type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => String(r.id)} loading={loading} caption="Audit log" onRowClick={setOpen} rowHeight={56} storageKey="audit" />

      <div className="flex items-center justify-end gap-3 text-[13px] text-[var(--ink-dim)]">
        <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        Page {page} of {pageCount}
        <Button size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.action ?? ""} subtitle={open ? `${open.actor_name} · ${new Date(open.at).toLocaleString("en-GB")}` : undefined}>
        {open && (
          <div className="flex flex-col gap-4 text-[13px]">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
              <dt className="text-[var(--ink-faint)]">What</dt><dd>{open.entity} {open.entity_id}</dd>
              <dt className="text-[var(--ink-faint)]">IP</dt><dd>{open.ip ?? "-"}</dd>
              {open.note && (<><dt className="text-[var(--ink-faint)]">Note</dt><dd>{open.note}</dd></>)}
            </dl>
            <div>
              <h3 className="mb-1 text-[12px] font-bold uppercase text-[var(--ink-faint)]">Before</h3>
              <pre className="max-h-64 overflow-auto rounded-xl bg-[var(--surface-tint)] p-3 text-[12px]">{json(open.before)}</pre>
            </div>
            <div>
              <h3 className="mb-1 text-[12px] font-bold uppercase text-[var(--ink-faint)]">After</h3>
              <pre className="max-h-64 overflow-auto rounded-xl bg-[var(--surface-tint)] p-3 text-[12px]">{json(open.after)}</pre>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
