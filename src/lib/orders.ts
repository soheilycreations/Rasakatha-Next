import type { CartItem } from "@/lib/cart";

export type PaymentStatus = "pending" | "paid" | "failed" | "cod";

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
  // set when the customer typed their own town (it wasn't in the list): priced as the standard zone
  district?: string;
  townNotInList?: boolean;
  giftDistrict?: string;
  giftTownNotInList?: boolean;
};

export type StoredOrder = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  payment: string;
  paymentStatus?: PaymentStatus;
  status: OrderStatus;
  customer: Customer;
};
