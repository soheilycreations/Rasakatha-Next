import type { CartItem } from "@/lib/cart";

export type OrderStatus = "processing" | "packed" | "shipped" | "delivered";

export const ORDER_STATUS_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "processing", label: "Order Placed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export type Customer = {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  isGift: boolean;
  giftName?: string;
  giftPhone?: string;
  giftCity?: string;
  giftAddress?: string;
};

export type StoredOrder = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: string;
  status: OrderStatus;
  customer: Customer;
};
