import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkPassword,
  createSession,
  isAdminConfigured,
} from "@/lib/server/adminAuth";
import { rateLimit } from "@/lib/server/rateLimit";

export async function POST(request: Request) {
  const limited = await rateLimit(request, "admin-login", 8, 15 * 60);
  if (limited) return limited;

  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin login is not configured on this server." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  if (!(await checkPassword(String(body?.password ?? "")))) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
