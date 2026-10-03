import { NextResponse } from "next/server";
import { ADMIN_COOKIE, SESSION_MAX_AGE_SECONDS, createSession } from "./adminAuth";
import type { Role } from "@/lib/permissions";

export async function setSessionCookie(res: NextResponse, s: { sid: string; role: Role; name: string; tf: boolean }) {
  res.cookies.set(ADMIN_COOKIE, await createSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
