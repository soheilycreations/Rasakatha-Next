import { NextResponse } from "next/server";
import { calculateShippingFee, isKnownDistrict, isKnownTown, zoneForTown } from "@/lib/shipping";

// Public, read-only: the delivery fee and zone for a town and weight (same function checkout and
// /api/orders use). ?town=Nugegoda&grams=300, or ?district=Jaffna&town=Somewhere&custom=1 for a town not in the list.
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const town = (sp.get("town") ?? "").trim();
  const grams = Math.min(50_000, Math.max(0, Number(sp.get("grams") ?? 300) || 0));
  const custom = sp.get("custom") === "1";
  const district = sp.get("district") ?? "";
  const valid = custom ? isKnownDistrict(district) && town.length >= 2 : isKnownTown(town);
  if (!valid) return NextResponse.json({ error: "Unknown town" }, { status: 404 });
  return NextResponse.json({
    town,
    zone: custom ? "REST" : zoneForTown(town),
    fee: calculateShippingFee(town, grams, { townNotInList: custom }),
  });
}
