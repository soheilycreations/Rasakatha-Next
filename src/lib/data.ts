export type CoverTheme = {
  from: string;
  to: string;
  ink: string;
  motif: "wave" | "leaf" | "moon" | "flame" | "rain" | "peacock";
};

export type Book = {
  id: string;
  title: string;
  titleSi?: string;
  author: string;
  category: string;
  blurb?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  cover: CoverTheme;
  badge?: string;
};

export const books: Book[] = [
  {
    id: "sanda-eliya",
    title: "Sanda Eliya",
    titleSi: "සඳ එළිය",
    author: "Malani Fonseka",
    category: "Fiction",
    blurb:
      "A moonlit village saga about love, memory and the ties that bind three generations of women.",
    price: 890,
    rating: 4.8,
    cover: { from: "#2b2559", to: "#0b0c10", ink: "#e8a838", motif: "moon" },
  },
  {
    id: "gini-kabala",
    title: "Gini Kabala",
    titleSi: "ගිනි කබල",
    author: "Ranjith Dharmakeerthi",
    category: "Thriller",
    blurb:
      "A relentless crime thriller set across the streets of Colombo, where one detective races the clock.",
    price: 950,
    rating: 4.6,
    cover: { from: "#5c1f1f", to: "#0b0c10", ink: "#ef6f6c", motif: "flame" },
  },
  {
    id: "vaessa-kalaya",
    title: "Vaessa Kalaya",
    titleSi: "වැස්ස කාලය",
    author: "Chamari Wickramasinghe",
    category: "Poetry",
    blurb: "A tender monsoon-season collection of verse on longing and homecoming.",
    price: 620,
    rating: 4.9,
    cover: { from: "#0f3d3a", to: "#0b0c10", ink: "#2fbfa0", motif: "rain" },
  },
  {
    id: "monara-katha",
    title: "Monara Katha",
    titleSi: "මොණර කථා",
    author: "Sunil Ariyaratne",
    category: "Folklore",
    blurb: "Retold folk tales of the highlands, illustrated in vivid oral tradition.",
    price: 780,
    rating: 4.7,
    cover: { from: "#1f2f5c", to: "#0b0c10", ink: "#8ecae6", motif: "peacock" },
  },
  {
    id: "kola-thatu",
    title: "Kola Thatu",
    titleSi: "කොළ තටු",
    author: "Nadeeka Guruge",
    category: "Nature",
    blurb: "An illustrated field journal of Sri Lanka's rainforest canopy.",
    price: 540,
    originalPrice: 720,
    discount: 25,
    rating: 4.5,
    cover: { from: "#264d1f", to: "#0b0c10", ink: "#9fd35c", motif: "leaf" },
    badge: "New",
  },
  {
    id: "hangi-katha",
    title: "Hangi Katha",
    titleSi: "හංගි කථා",
    author: "Deepthi Kumara Gunaratne",
    category: "Mystery",
    blurb: "Vanished heirlooms, a family curse, and a granddaughter determined to solve it.",
    price: 460,
    originalPrice: 690,
    discount: 33,
    rating: 4.4,
    cover: { from: "#3a1f4d", to: "#0b0c10", ink: "#c792ea", motif: "moon" },
  },
  {
    id: "sulanga-sina",
    title: "Sulanga Sina",
    titleSi: "සුළඟ සිනා",
    author: "Piyal Kariyawasam",
    category: "Romance",
    blurb: "Two childhood friends, one seaside town, and a love letter twenty years late.",
    price: 399,
    originalPrice: 799,
    discount: 50,
    rating: 4.7,
    cover: { from: "#5c2d4a", to: "#0b0c10", ink: "#ef6f6c", motif: "wave" },
  },
  {
    id: "diya-sina",
    title: "Diya Sina",
    titleSi: "දිය සිනා",
    author: "Ruwanthi Mangala",
    category: "Children",
    blurb: "A splashy picture book about a curious fish who explores every river bend.",
    price: 350,
    originalPrice: 500,
    discount: 30,
    rating: 4.9,
    cover: { from: "#1a4a5c", to: "#0b0c10", ink: "#5cd3e6", motif: "wave" },
    badge: "Bestseller",
  },
  {
    id: "mal-sihina",
    title: "Mal Sihina",
    titleSi: "මල් සිහින",
    author: "Kumari Jayasinghe",
    category: "Poetry",
    blurb: "Flower-scented dreams and quiet devotion — a debut poetry chapbook.",
    price: 480,
    originalPrice: 600,
    discount: 20,
    rating: 4.3,
    cover: { from: "#4d3a1f", to: "#0b0c10", ink: "#e8a838", motif: "leaf" },
  },
];

export const featured = books.slice(0, 4);
export const onSale = books.filter((b) => b.discount);
export const continueReading = [
  { book: books[0], progress: 62 },
  { book: books[3], progress: 28 },
  { book: books[6], progress: 84 },
];

export const categories = [
  { name: "Fiction", count: 214, icon: "book" },
  { name: "Poetry", count: 96, icon: "feather" },
  { name: "Thriller", count: 132, icon: "bolt" },
  { name: "Folklore", count: 58, icon: "mask" },
  { name: "Children", count: 140, icon: "star" },
  { name: "Romance", count: 176, icon: "heart" },
];
