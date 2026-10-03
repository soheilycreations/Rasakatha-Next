export type CartItem = {
  id: string;
  title: string;
  author?: string;
  cover?: string | null;
  price?: number;
  // list price when the book is on sale (price < regularPrice), used to show savings
  regularPrice?: number;
  weight?: number;
  qty: number;
};
