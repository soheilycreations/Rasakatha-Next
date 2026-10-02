import { NextResponse } from "next/server";
import { authClient } from "@/lib/server/customerAuth";
import { rateLimit } from "@/lib/server/rateLimit";
import { SITE } from "@/lib/site";

// Sends the Supabase password-reset email. Always answers ok so the endpoint
// can't be used to find out which emails have accounts.
// Supabase dashboard -> Authentication -> URL Configuration must allow
// `${SITE_URL}/reset-password` as a redirect URL.
export async function POST(request: Request) {
  const limited = await rateLimit(request, "customer-forgot", 5, 60 * 60);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const { error } = await authClient().auth.resetPasswordForEmail(email, { redirectTo: `${SITE.url}/reset-password` });
  if (error) console.error("[auth] resetPasswordForEmail failed:", error.message);
  return NextResponse.json({ ok: true });
}
