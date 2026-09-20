const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "rasakatha2026";
const SECRET = process.env.ADMIN_SESSION_SECRET || "rasakatha-admin-secret";

export const ADMIN_COOKIE = "rk_admin_session";

export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode(`${SECRET}:admin-session`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await sessionToken());
}
