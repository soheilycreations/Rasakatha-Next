import { supabase } from "./supabase";
import { SITE } from "@/lib/site";
import { settingsSchema, type Settings } from "@/lib/schemas/admin";

// Store settings live in one row (settings.key = 'app'). Missing table/row = the defaults below.
export const DEFAULT_SETTINGS: Settings = {
  store: { name: SITE.legalName, address: SITE.address, phone: SITE.phone, email: SITE.email }, // CONFIRM details
  receipt: { header: "", footer: "Thank you for shopping with us!" },
  tax: { enabled: false, rate: 0, label: "VAT" },
  discountLimits: { owner: 100, manager: 25, cashier: 10, stock: 0 },
  lowStockThreshold: 5,
  // CONFIRM: owner to confirm the royalty / consignment defaults and credit terms.
  defaults: { royaltyPercent: 10, consignmentPayablePercent: 70 },
  creditTermsDays: 30,
  couriers: [], // CONFIRM: add the courier companies you use
};

let cache: { at: number; value: Settings } | null = null;
const TTL = 30_000;

export function mergeSettings(stored: unknown): Settings {
  const s = (stored ?? {}) as Partial<Settings>;
  const merged = {
    ...DEFAULT_SETTINGS,
    ...s,
    store: { ...DEFAULT_SETTINGS.store, ...s.store },
    receipt: { ...DEFAULT_SETTINGS.receipt, ...s.receipt },
    tax: { ...DEFAULT_SETTINGS.tax, ...s.tax },
    discountLimits: { ...DEFAULT_SETTINGS.discountLimits, ...s.discountLimits },
    defaults: { ...DEFAULT_SETTINGS.defaults, ...s.defaults },
  };
  const parsed = settingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_SETTINGS;
}

export async function getSettings(): Promise<Settings> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  const { data, error } = await supabase().from("settings").select("value").eq("key", "app").maybeSingle();
  const value = error ? DEFAULT_SETTINGS : mergeSettings(data?.value);
  cache = { at: Date.now(), value };
  return value;
}

export function invalidateSettings() {
  cache = null;
}
