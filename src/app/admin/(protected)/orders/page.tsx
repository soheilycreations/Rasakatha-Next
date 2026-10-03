"use client";

import { useCallback, useEffect, useState } from "react";
import { money } from "@/lib/format";
import { ORDER_STATUS_STEPS, type OrderStatus, type StoredOrder } from "@/lib/orders";
import { totalSavings } from "@/lib/savings";
import { Badge, Button, DataTable, Drawer, EmptyState, Input, Select, useToast, type Column } from "@/components/admin/ui";

const PAYMENT_LABELS: Record<string, string> = { cod: "Cash on Delivery", payhere: "PayHere", koko: "Koko BNPL", mintpay: "MintPay" };
const STATUS_TONE: Record<OrderStatus, "info" | "neutral" | "warning" | "success"> = { processing: "info", packed: "neutral", shipped: "warning", delivered: "success" };

// The customer typed their own town (not in the Sri Lanka Post list): check it before dispatch.
function TownFlag() {
  return <Badge tone="warning">Town not in list: confirm address</Badge>;
}

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  // deep link from the command palette: ?open=<order id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");
    if (id) queueMicrotask(() => { setDeepLink(id); setOpenId(id); });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: "25", search: debounced });
    if (status !== "all") p.set("status", status);
    if (deepLink) p.set("open", deepLink);
    queueMicrotask(() => setLoading(true));
    fetch(`/api/admin/orders?${p}`)
      .then((r) => r.json())
      .then((d: { items: StoredOrder[]; total: number; pageCount: number }) => {
        setOrders(d.items ?? []);
        setTotal(d.total ?? 0);
        setPageCount(d.pageCount ?? 1);
        setLoading(false);
      });
  }, [page, debounced, status, deepLink]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, next: OrderStatus) => {
    const previous = orders.find((o) => o.id === id)?.status;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)));
    const res = await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: next }) });
    if (!res.ok && previous) {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: previous } : o)));
      toast("Could not update the status. Try again.", { tone: "error" });
    } else {
      toast(`Order #${id} is now ${ORDER_STATUS_STEPS.find((s) => s.key === next)?.label}`, {
        undo: previous
          ? async () => {
              await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: previous }) });
              setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: previous } : o)));
            }
          : undefined,
      });
    }
  };

  const open = orders.find((o) => o.id === openId) ?? null;

  const columns: Column<StoredOrder>[] = [
    { key: "id", header: "Order", width: "130px", sortValue: (o) => o.createdAt, cell: (o) => <span className="font-semibold">#{o.id}</span> },
    {
      key: "customer",
      header: "Customer",
      sortValue: (o) => o.customer.name.toLowerCase(),
      cell: (o) => (
        <div className="min-w-0">
          <div className="truncate">{o.customer.name}</div>
          <div className="truncate text-[12px] text-[var(--ink-dim)]">{o.customer.phone}</div>
        </div>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      width: "170px",
      hideBelow: "md",
      cell: (o) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[var(--ink-dim)]">{PAYMENT_LABELS[o.payment] ?? o.payment}</span>
          {o.payment !== "cod" && o.paymentStatus && <Badge tone={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "failed" ? "accent" : "warning"}>{o.paymentStatus}</Badge>}
        </span>
      ),
    },
    { key: "total", header: "Total", width: "110px", align: "right", sortValue: (o) => o.total, cell: (o) => <span className="font-semibold">{money(o.total)}</span> },
    { key: "status", header: "Status", width: "120px", sortValue: (o) => o.status, cell: (o) => <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_STEPS.find((s) => s.key === o.status)?.label}</Badge> },
    { key: "date", header: "Date", width: "100px", hideBelow: "lg", sortValue: (o) => o.createdAt, cell: (o) => <span className="text-[12px] text-[var(--ink-dim)]">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span> },
  ];

  const place = (o: StoredOrder) => (o.customer.isGift ? { name: o.customer.giftName, phone: o.customer.giftPhone, address: o.customer.giftAddress, city: o.customer.giftCity, district: o.customer.giftDistrict, flag: o.customer.giftTownNotInList } : { name: o.customer.name, phone: o.customer.phone, address: o.customer.address, city: o.customer.city, district: o.customer.district, flag: o.customer.townNotInList });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Web orders</h1>
        <p className="mt-1 text-[13.5px] text-[var(--ink-dim)]">
          {total.toLocaleString()} order{total === 1 ? "" : "s"}{status !== "all" || debounced ? " match" : " placed so far"}.
        </p>
      </div>

      <div className="grid max-w-2xl gap-3 sm:grid-cols-[2fr_1fr]">
        <Input label="Search orders" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order ID, customer or phone" />
        <Select label="Status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as OrderStatus | "all"); }}>
          <option value="all">All statuses</option>
          {ORDER_STATUS_STEPS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(o) => o.id}
        loading={loading}
        caption="Web orders"
        onRowClick={(o) => setOpenId(o.id)}
        storageKey="orders"
        empty={<EmptyState title="No orders found">{total === 0 && !debounced && status === "all" ? "Placed orders will show up here." : "Nothing matches your search."}</EmptyState>}
      />

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-[13px] text-[var(--ink-dim)]">
          <Button size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          Page {page} of {pageCount}
          <Button size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open ? `Order #${open.id}` : ""}
        subtitle={open ? `${new Date(open.createdAt).toLocaleString("en-GB")} · ${PAYMENT_LABELS[open.payment] ?? open.payment}` : undefined}
      >
        {open && (
          <div className="flex flex-col gap-6">
            <Select label="Order status" value={open.status} onChange={(e) => updateStatus(open.id, e.target.value as OrderStatus)}>
              {ORDER_STATUS_STEPS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </Select>

            <section>
              <h3 className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">Items</h3>
              <div className="flex flex-col gap-2">
                {open.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-[13px]">
                    <span className="min-w-0 break-words text-[var(--ink-dim)]">{item.title} × {item.qty}</span>
                    <span className="shrink-0 text-[var(--ink)]">{item.price != null ? money(item.price * item.qty) : "-"}</span>
                  </div>
                ))}
              </div>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 border-t border-[var(--border)] pt-3 text-[13px]">
                <dt className="text-[var(--ink-dim)]">Subtotal</dt><dd>{money(open.subtotal)}</dd>
                {totalSavings(open.items) > 0 && (<><dt className="font-semibold text-[var(--success-text)]">Customer saved</dt><dd className="font-semibold text-[var(--success-text)]">{money(totalSavings(open.items))}</dd></>)}
                <dt className="text-[var(--ink-dim)]">Delivery</dt><dd>{money(open.deliveryFee)}</dd>
                <dt className="font-bold">Total</dt><dd className="font-bold">{money(open.total)}</dd>
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">{open.customer.isGift ? "Gift delivery" : "Delivery"}</h3>
              {(() => {
                const p = place(open);
                return (
                  <div className="text-[13px] text-[var(--ink-dim)]">
                    <div className="font-semibold text-[var(--ink)]">{p.name}</div>
                    <div>{p.phone}</div>
                    <div>{p.address}, {p.city}{p.district ? `, ${p.district}` : ""}</div>
                    {p.flag && <div className="mt-1.5"><TownFlag /></div>}
                    {!open.customer.isGift && <div className="mt-1">{open.customer.email}</div>}
                  </div>
                );
              })()}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
