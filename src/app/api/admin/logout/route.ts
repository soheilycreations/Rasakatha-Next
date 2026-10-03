import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/server/adminAuth";
import { audit } from "@/lib/server/audit";

export async function POST() {
  await audit({ action: "auth.logout", entity: "staff" });
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
