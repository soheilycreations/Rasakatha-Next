import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";
import { authClient, setSessionCookies, toAccount } from "@/lib/server/customerAuth";
import { rateLimit } from "@/lib/server/rateLimit";

// Turns the tokens Supabase puts in the URL hash after Google sign-in into our
// httpOnly session cookies. Tokens are verified with Supabase before use.
export async function POST(request: Request) {
  const limited = await rateLimit(request, "customer-session", 20, 10 * 60);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const accessToken = String(body?.accessToken ?? "");
  const refreshToken = String(body?.refreshToken ?? "");
  const expiresIn = Number(body?.expiresIn) || 3600;
  if (!accessToken || !refreshToken) return NextResponse.json({ error: "Missing tokens" }, { status: 400 });

  const { data, error } = await authClient().auth.getUser(accessToken);
  if (error || !data.user) return NextResponse.json({ error: "Invalid sign-in" }, { status: 401 });

  await setSessionCookies({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    token_type: "bearer",
    user: data.user,
  } as Session);
  return NextResponse.json(toAccount(data.user));
}
