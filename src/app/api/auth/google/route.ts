import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";

// Starts Google sign-in through Supabase OAuth (implicit flow). Only available
// when NEXT_PUBLIC_GOOGLE_AUTH=true, i.e. the Google provider is enabled in the
// Supabase dashboard and `${SITE_URL}/auth/callback` is an allowed redirect URL.
export async function GET() {
  const base = process.env.SUPABASE_URL;
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH !== "true" || !base) {
    return NextResponse.redirect(new URL("/", SITE.url));
  }
  const url = new URL("/auth/v1/authorize", base);
  url.searchParams.set("provider", "google");
  url.searchParams.set("redirect_to", `${SITE.url}/auth/callback`);
  return NextResponse.redirect(url);
}
