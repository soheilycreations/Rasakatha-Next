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
// service). Every other town (all of Sri Lanka Post's list) falls back to REST.
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

// ---- Locations -------------------------------------------------------------------------------
// Every Sri Lanka Post town/city with its district and postal code (2,100+ entries).
// Source: github.com/madurapa/sri-lanka-provinces-districts-cities (MIT License), built by
// scripts/build-locations.mjs into src/lib/data/sl-locations.json. Rows: [town, district, postalCode].
// Towns from the previous hand-written list that the dataset lacks were kept (no postal code).
import raw from "./data/sl-locations.json";

export type Location = { town: string; district: string; postalCode: string };

export const LOCATIONS: Location[] = (raw as [string, string, string][]).map(([town, district, postalCode]) => ({
  town,
  district,
  postalCode,
}));

export const DISTRICTS: string[] = [...new Set(LOCATIONS.map((l) => l.district))].sort();

const TOWN_NAMES = new Set(LOCATIONS.map((l) => l.town));
export const isKnownTown = (town: string) => TOWN_NAMES.has(town);
export const isKnownDistrict = (district: string) => DISTRICTS.includes(district);

// Same place as a zoned town, spelled the way Sri Lanka Post spells it. They get that town's zone;
// no other town changes zone.
const ZONE_ALIASES: Record<string, string> = {
  Narahenpita: "A",
  "Sri Jayawardenepura": "B",
};
const COLOMBO_POSTAL_AREA = /^Colombo (0?[1-9]|1[0-5])$/; // "Colombo 1" .. "Colombo 15" are Colombo (zone A)

export function zoneForTown(town: string): string {
  if (ZONE_TOWNS[town]) return ZONE_TOWNS[town];
  if (ZONE_ALIASES[town]) return ZONE_ALIASES[town];
  if (COLOMBO_POSTAL_AREA.test(town)) return "A";
  return "REST";
}

// townNotInList: the customer typed their own town (picked only a district), which is priced as REST.
export function calculateShippingFee(town: string, totalWeightGrams: number, opts?: { townNotInList?: boolean }): number {
  if (totalWeightGrams <= 0) return 0;
  const zone = opts?.townNotInList ? "REST" : zoneForTown(town);
  const table = ZONE_RATES[zone] ?? ZONE_RATES.REST;
  const bracket = Math.min(table.length - 1, Math.max(0, Math.ceil(totalWeightGrams / 1000) - 1));
  return table[bracket];
}
