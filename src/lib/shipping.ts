// Real courier zones + weight-based rate brackets, sourced from the store's
// actual WooCommerce shipping configuration (Flexible Shipping rules).
// Each bracket covers up to 1000g more than the last; rate = Rs for that band.

type RateTable = number[]; // index i => rate for weight bracket (i*1000, (i+1)*1000]

const ZONE_RATES: Record<string, RateTable> = {
  A: [350, 450, 550, 650, 750, 850, 950, 1050, 1150, 1250],
  B: [400, 500, 600, 700, 800, 899, 1000, 1100, 1200, 1300],
  C: [450, 550, 650, 750, 850, 950, 1050, 1150, 1250, 1350],
  D: [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400],
  REST: [450, 550, 650, 750, 850, 950, 1050, 1150, 1250, 1350],
};

// Towns explicitly configured as their own courier zone (cheaper, closer-in
// service). Everything else in the district list below falls back to REST.
const ZONE_TOWNS: Record<string, string> = {
  Colombo: "A",
  Narahempita: "A",
  "Slave Island": "A",
  Battaramulla: "B",
  Dehiwala: "B",
  Kalubowila: "B",
  "Mount Lavinia": "B",
  Nawala: "B",
  Nugegoda: "B",
  Rajagiriya: "B",
  Ratmalana: "B",
  "Sri Jayawardenepura Kotte": "B",
  Welikada: "B",
  Attidiya: "B",
  Athurugiriya: "C",
  Avissawella: "C",
  Boralesgamuwa: "C",
  Homagama: "C",
  Kaduwela: "C",
  Kesbewa: "C",
  Kottawa: "C",
  Maharagama: "C",
  Malabe: "C",
  Pannipitiya: "C",
  Piliyandala: "C",
  Jaffna: "D",
  Ampara: "D",
  Batticaloa: "D",
  Kataragama: "D",
  Pussellawa: "D",
};

export type District = { name: string; towns: string[] };

export const SRI_LANKA_LOCATIONS: District[] = [
  {
    name: "Colombo",
    towns: [
      "Colombo", "Narahempita", "Slave Island", "Battaramulla", "Dehiwala", "Kalubowila",
      "Mount Lavinia", "Nawala", "Nugegoda", "Rajagiriya", "Ratmalana",
      "Sri Jayawardenepura Kotte", "Welikada", "Attidiya", "Athurugiriya", "Avissawella",
      "Boralesgamuwa", "Homagama", "Kaduwela", "Kesbewa", "Kottawa", "Maharagama",
      "Malabe", "Pannipitiya", "Piliyandala", "Padukka", "Moratuwa",
    ],
  },
  {
    name: "Gampaha",
    towns: [
      "Negombo", "Gampaha", "Ja-Ela", "Wattala", "Kelaniya", "Kadawatha", "Ragama",
      "Minuwangoda", "Divulapitiya", "Nittambuwa", "Kiribathgoda",
    ],
  },
  {
    name: "Kalutara",
    towns: ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama", "Matugama", "Wadduwa"],
  },
  {
    name: "Kandy",
    towns: ["Kandy", "Peradeniya", "Gampola", "Nawalapitiya", "Katugastota", "Pussellawa", "Wattegama"],
  },
  { name: "Matale", towns: ["Matale", "Dambulla", "Galewela", "Naula"] },
  {
    name: "Nuwara Eliya",
    towns: ["Nuwara Eliya", "Hatton", "Nanu Oya", "Talawakele", "Ginigathhena"],
  },
  { name: "Galle", towns: ["Galle", "Hikkaduwa", "Ambalangoda", "Elpitiya", "Baddegama"] },
  { name: "Matara", towns: ["Matara", "Weligama", "Akuressa", "Deniyaya"] },
  { name: "Hambantota", towns: ["Hambantota", "Tangalle", "Tissamaharama", "Ambalantota"] },
  { name: "Jaffna", towns: ["Jaffna", "Chavakachcheri", "Point Pedro", "Nallur"] },
  { name: "Kilinochchi", towns: ["Kilinochchi", "Pallai"] },
  { name: "Mannar", towns: ["Mannar", "Nanaddan"] },
  { name: "Vavuniya", towns: ["Vavuniya", "Nedunkeni"] },
  { name: "Mullaitivu", towns: ["Mullaitivu", "Puthukkudiyiruppu"] },
  { name: "Batticaloa", towns: ["Batticaloa", "Kattankudy", "Eravur", "Valachchenai"] },
  { name: "Ampara", towns: ["Ampara", "Kalmunai", "Sammanthurai", "Akkaraipattu"] },
  { name: "Trincomalee", towns: ["Trincomalee", "Kinniya", "Kantale"] },
  { name: "Kurunegala", towns: ["Kurunegala", "Kuliyapitiya", "Narammala", "Pannala"] },
  { name: "Puttalam", towns: ["Puttalam", "Chilaw", "Wennappuwa", "Marawila"] },
  { name: "Anuradhapura", towns: ["Anuradhapura", "Kekirawa", "Medawachchiya", "Thambuttegama"] },
  { name: "Polonnaruwa", towns: ["Polonnaruwa", "Kaduruwela", "Hingurakgoda"] },
  { name: "Badulla", towns: ["Badulla", "Bandarawela", "Haputale", "Welimada", "Mahiyanganaya"] },
  { name: "Monaragala", towns: ["Monaragala", "Wellawaya", "Kataragama", "Bibile"] },
  { name: "Ratnapura", towns: ["Ratnapura", "Balangoda", "Embilipitiya", "Pelmadulla"] },
  { name: "Kegalle", towns: ["Kegalle", "Mawanella", "Warakapola", "Rambukkana"] },
];

export function zoneForTown(town: string): string {
  return ZONE_TOWNS[town] ?? "REST";
}

export function calculateShippingFee(town: string, totalWeightGrams: number): number {
  if (totalWeightGrams <= 0) return 0;
  const zone = zoneForTown(town);
  const table = ZONE_RATES[zone] ?? ZONE_RATES.REST;
  const bracket = Math.min(table.length - 1, Math.max(0, Math.ceil(totalWeightGrams / 1000) - 1));
  return table[bracket];
}
