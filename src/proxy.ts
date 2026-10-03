import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, readSession } from "@/lib/server/adminAuth";
import { can, homeFor, permissionForRequest } from "@/lib/permissions";

// Gate for everything under /admin and /api/admin. Order: public auth endpoints -> signed session ->
// 2FA setup lock -> role permission from the matrix in src/lib/permissions.ts (deny by default).
// Route handlers re-check with requirePermission() (live staff record), so this is the first line, not the only one.

const PUBLIC_PATHS = ["/admin/login", "/api/admin/login"];
const SETUP_ALLOWED = ["/admin/account", "/api/admin/account", "/api/admin/me", "/api/admin/logout"];

const isPublic = (p: string) => PUBLIC_PATHS.some((x) => p === x || p.startsWith(x + "/"));
const startsWithAny = (p: string, list: string[]) => list.some((x) => p === x || p.startsWith(x + "/"));

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await readSession(req.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname === "/admin/login") {
    if (session?.tf) return NextResponse.redirect(new URL(homeFor(session.role), req.url));
    return NextResponse.next();
  }
  if (isPublic(pathname)) return NextResponse.next();

  const unauthenticated = () =>
    isApi ? NextResponse.json({ error: "Unauthorized" }, { status: 401 }) : NextResponse.redirect(new URL("/admin/login", req.url));
  if (!session) return unauthenticated();

  // Owners and managers must finish two-factor setup before anything else.
  if (!session.tf && !startsWithAny(pathname, SETUP_ALLOWED)) {
    return isApi
      ? NextResponse.json({ error: "Set up two-factor authentication first" }, { status: 403 })
      : NextResponse.redirect(new URL("/admin/account?setup=1", req.url));
  }

  const needed = permissionForRequest(pathname, req.method);
  const allowed = needed === "open" ? true : needed === "owner-only" ? session.role === "owner" : can(session.role, needed);
  if (!allowed) {
    return isApi
      ? NextResponse.json({ error: "You don't have permission to do that" }, { status: 403 })
      : NextResponse.redirect(new URL(`${homeFor(session.role)}?denied=1`, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
