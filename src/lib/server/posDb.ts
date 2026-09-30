import type { PosSale, PosSaleItem, PosPaymentMethod } from "@/lib/pos";

export type PosSaleRow = {
  id: string;
  created_at: string;
  items: PosSaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment: string;
  customer_name: string | null;
  note: string | null;
};

export function rowToPosSale(r: PosSaleRow): PosSale {
  return {
    id: r.id,
    createdAt: r.created_at,
    items: r.items,
    subtotal: Number(r.subtotal),
    discount: Number(r.discount),
    total: Number(r.total),
    payment: r.payment as PosPaymentMethod,
    customerName: r.customer_name ?? undefined,
    note: r.note ?? undefined,
  };
}
