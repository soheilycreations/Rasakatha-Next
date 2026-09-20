export type CartItem = {
  id: string;
  title: string;
  author?: string;
  cover?: string | null;
  price?: number;
  weight?: number;
  qty: number;
};
