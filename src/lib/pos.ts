export type PosSaleItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
};

export type PosPaymentMethod = "cash" | "card" | "other";

export const POS_PAYMENT_LABELS: Record<PosPaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  other: "Other",
};

export type PosSale = {
  id: string;
  createdAt: string;
  items: PosSaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment: PosPaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  note?: string;
};
