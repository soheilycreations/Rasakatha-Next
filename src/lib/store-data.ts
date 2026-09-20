export type Slide = {
  id: string;
  title: string;
  author: string;
  kicker: string;
  blurb: string;
  cta: string;
  tint: string;
  cover?: string;
};

export const FEATURED: Slide[] = [
  { id: "3453", title: "Awasan Katayuthu Dilliyedi – අවසන් කටයුතු දිල්ලියේදී", author: "Chetan Bhagat, Dileepa Jayakodi", kicker: "Young adult", blurb: "මං දන්නෙ කොහොමද? මෙයාලා මට මොනවත් කියන්නෙ නෑ… හැමෝම තම තමන්ගෙ වැඩ… ඔය ප්‍රෙර්නා… ගෙදර එන්නෙ යක්කු ගස් නගින වෙලාවට… ඇහුවම කියන්නෙ වැඩ ඇරිල එන වෙලාව කියල… කෙල්ලෙකුට ඔය…", cta: "BUY NOW", tint: "#7c1c18", cover: "/covers/book-3453.png" },
  { id: "3456", title: "Bindunu Bilinda – බිඳුණු බිලින්දා", author: "Dileepa Jayakodi, Cathy Glass", kicker: "Bestseller", blurb: "ළදරු වියේ සිට අට වසරක් යන තුරු තම පියා, මව හා තවත් වැඩිහිටි ගැහැනු, පිරිමි රැසක් විසින් ලිංගික අපහරණයෙහි යොදා ගන්නා ලද දැරියක පිලිබඳ හද කම්පා කරවන අමිහිරි සත්‍ය…", cta: "BUY NOW", tint: "#1f4d63", cover: "/covers/book-3456.jpg" },
  { id: "3464", title: "Denna Depaththe – දෙන්නා දෙපැත්තේ ආරති මැද්දේ", author: "Chetan Bhagat, Dileepa Jayakodi", kicker: "New release", blurb: "රයිටෙක් වෙච්ච සල්ලිකාර රාගව්, නාහෙට නාහන මොළකාර අපතයෙක් වූ ගෝපාල් අතරට මැදිවන සොඳුරු මුවැත්තියක වන ආරති නිම්හිම් නැති ආදරයේ දෙකෙලවරටම රැගෙන යන තුන් ඈඳතු ප්‍රේමයේ…", cta: "BUY NOW", tint: "#5a3b1e", cover: "/covers/book-3464.png" },
  { id: "3509", title: "Adisi Nadiya – අදිසි නදිය", author: "Kapila Kumara Kalinga", kicker: "Bestseller", blurb: "මායාරූපී ප්‍රබන්ධ, අධිතාත්වික පරිකල්පනය, වීරාඛ්‍යානය, දේශපාලන සහ විද්‍යා ප්‍රබන්ධ යනාදී සාහිත්‍ය ශානර ඔස්සේ ගලා බස්නා ‘අදිසි නදිය’ කුතුහලාත්මක බවින් පිරි සුපාඨනීය…", cta: "BUY NOW", tint: "#2f5a3a", cover: "/covers/book-3509.png" },
  { id: "3517", title: "Chakrawarthi – චක්‍රවර්ති", author: "Chulabhaya Shantha Kumara Herath", kicker: "Bestseller", blurb: "සුරස මුද්‍රාව යටතේ සූරියකුසුම, සඛී භාර්යා සහ මා යන පාඨක සම්මානයෙන් පිදුම් ලත් නවකතා නිර්මාණය කළ ප්‍රවීණ ලේඛක චූලාභය ශාන්ත කුමාර හේරත්ගේ නවතම නවකතාවයි චක්‍රවර්ති. හෙළ…", cta: "BUY NOW", tint: "#3d2a52", cover: "" },
];

export type Arrival = { id: string; title: string; author: string; tint: string; cover?: string };

export const ARRIVALS: Arrival[] = [
  { id: "38546", title: "මල්කොටුවේ ගෙදර | Malkotuwe Gedara", author: "Linda Jayalath", tint: "#2f5a3a", cover: "/covers/book-38546.jpeg" },
  { id: "38540", title: "බලෙන් කරපු කසාදේ | Balen Karapu Kasade", author: "Nehansa Sooriyabandara", tint: "#3d2a52", cover: "/covers/book-38540.jpeg" },
  { id: "38511", title: "ටොක්සි ඩොක්සි | Toxie Doxie", author: "Thamodya Jayarathna, Shyamika J Basnayaka", tint: "#6b2320", cover: "/covers/book-38511.jpeg" },
  { id: "38449", title: "මැයි වැහි | Mai Wahi - Pre Order", author: "Navodya Wijerathna", tint: "#4a3a1c", cover: "/covers/book-38449.png" },
  { id: "38422", title: "Saman Edirimunee's Book Bundle Offer", author: "Saman Edirimunee", tint: "#155158", cover: "/covers/book-38422.png" },
  { id: "38292", title: "Nostalgia | නොස්ටැල්ජියා", author: "Kavindya Hettiarachchi", tint: "#5f2136", cover: "/covers/book-38292.png" },
];

export type SaleBook = {
  id: string;
  title: string;
  author: string;
  format: string;
  off: string;
  was: string;
  now: string;
  tint: string;
  cover?: string;
};

export const SALE: SaleBook[] = [
  { id: "775", title: "71 කුරුටු ගී-71 Kurutu Gee", author: "U.R Perera-U.R පෙරේරා", format: "WAR", off: "-15%", was: "Rs. 300", now: "Rs. 255", tint: "#6b2320", cover: "/covers/book-775.png" },
  { id: "824", title: "සම්පිණ්ඩන-Sampindana", author: "Wijayananda Jayaweera-විජයානන්ද ජයවීර", format: "EDUCATIONAL", off: "-15%", was: "Rs. 460", now: "Rs. 391", tint: "#4a3a1c", cover: "/covers/book-824.png" },
  { id: "1397", title: "Miniththu Ekolahe Kathandare | මිනිත්තු එකොළහේ කතන්දරේ", author: "Ruwini Thalpawila", format: "SHORT STORIES", off: "-10%", was: "Rs. 1,200", now: "Rs. 1,080", tint: "#155158", cover: "/covers/book-1397.jpg" },
  { id: "1442", title: "සොෆිගේ ලෝකය | Sofige Lokaya", author: "Rani Senarathna Rajapaksha", format: "SHORT STORIES", off: "-10%", was: "Rs. 1,800", now: "Rs. 1,620", tint: "#5f2136", cover: "/covers/book-1442.jpg" },
  { id: "1710", title: "Demian", author: "Mahinda Pathirana", format: "FICTION", off: "-10%", was: "Rs. 980", now: "Rs. 882", tint: "#3f4a1e", cover: "/covers/book-1710.jpg" },
  { id: "1862", title: "Wismitha Sihina Dhakinna", author: "Damitha Nipunajith", format: "FANTASY", off: "-10%", was: "Rs. 1,000", now: "Rs. 900", tint: "#7c1c18", cover: "/covers/book-1862.jpg" },
  { id: "1918", title: "Baththalangunduwa", author: "Manjula Wediwardhana", format: "FICTION", off: "-10%", was: "Rs. 980", now: "Rs. 882", tint: "#1f4d63", cover: "/covers/book-1918.jpg" },
  { id: "2121", title: "Kalawakashaye Sirakaruwa", author: "Damitha Nipunajith", format: "SCIENCE FICTION", off: "-10%", was: "Rs. 1,200", now: "Rs. 1,080", tint: "#5a3b1e", cover: "/covers/book-2121.jpg" },
  { id: "2217", title: "Maga Digata Janakatha - 2", author: "DP Wickramasinghe", format: "BOOK", off: "-10%", was: "Rs. 600", now: "Rs. 540", tint: "#2f5a3a", cover: "/covers/book-2217.jpg" },
  { id: "2295", title: "Nihada Sakshi", author: "Chandrasiri Niriella", format: "OTHER", off: "-10%", was: "Rs. 1,000", now: "Rs. 900", tint: "#3d2a52", cover: "/covers/book-2295.jpg" },
];

export const NAV_ITEMS = ["Home", "Categories", "My Library"] as const;
