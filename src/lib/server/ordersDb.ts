import type { StoredOrder } from "@/lib/orders";

export type OrderRow = {
  id: string;
  created_at: string;
  items: StoredOrder["items"];
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment: string;
  status: StoredOrder["status"];
  customer: StoredOrder["customer"];
};

export function rowToOrder(r: OrderRow): StoredOrder {
  return {
    id: r.id,
    createdAt: r.created_at,
    items: r.items,
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    total: Number(r.total),
    payment: r.payment,
    status: r.status,
    customer: r.customer,
  };
}
