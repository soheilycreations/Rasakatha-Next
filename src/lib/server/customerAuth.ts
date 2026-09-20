import { cookies } from "next/headers";
import { createClient, type Session, type User } from "@supabase/supabase-js";

import type { Account } from "@/lib/account";

const ACCESS_COOKIE = "rk_at";
const REFRESH_COOKIE = "rk_rt";

// A throwaway client per call: sign-in/refresh must not share session state
// between requests.
export function authClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function toAccount(u: User): Account {
  return {
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.name as string) ?? "",
    phone: (u.user_metadata?.phone as string) ?? "",
  };
}

export async function setSessionCookies(session: Session) {
  const jar = await cookies();
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  jar.set(ACCESS_COOKIE, session.access_token, { ...base, maxAge: session.expires_in ?? 3600 });
  jar.set(REFRESH_COOKIE, session.refresh_token, { ...base, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

// Returns the signed-in customer, transparently refreshing an expired access
// token using the refresh cookie.
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (access) {
    const { data } = await authClient().auth.getUser(access);
    if (data.user) return toAccount(data.user);
  }
  if (refresh) {
    const { data } = await authClient().auth.refreshSession({ refresh_token: refresh });
    if (data.session && data.user) {
      await setSessionCookies(data.session);
      return toAccount(data.user);
    }
  }
  return null;
}
