// Admin session: a signed, expiring cookie (HMAC-SHA256 over "expiry.nonce").
// Uses Web Crypto only, so it runs in the proxy and in route handlers alike.
//
// In production ADMIN_PASSWORD and ADMIN_SESSION_SECRET are required: without
// them login is refused and no session is ever valid. The dev fallbacks below
// only apply when NODE_ENV !== "production".

export const ADMIN_COOKIE = "rk_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const enc = new TextEncoder();

function config(): { password: string; secret: string } | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!password || !secret || secret.length < 16) {
      console.error("[admin] ADMIN_PASSWORD and ADMIN_SESSION_SECRET (16+ chars) must be set in production");
      return null;
    }
    return { password, secret };
  }
  return { password: password || "dev-password", secret: secret || "dev-only-secret-change-me" };
}

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

function fromHex(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/.test(hex) || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function hmacKey(secret: string, usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

export function isAdminConfigured(): boolean {
  return config() !== null;
}

// Constant-time password check: compare SHA-256 digests byte by byte without early exit.
export async function checkPassword(input: string): Promise<boolean> {
  const cfg = config();
  if (!cfg || typeof input !== "string") return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(cfg.password)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createSession(): Promise<string> {
  const cfg = config();
  if (!cfg) throw new Error("Admin auth is not configured");
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const nonce = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer as ArrayBuffer);
  const payload = `${expiry}.${nonce}`;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(cfg.secret, "sign"), enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  const cfg = config();
  if (!cfg || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiry, nonce, sigHex] = parts;
  if (!/^\d+$/.test(expiry) || Number(expiry) < Date.now() / 1000) return false;
  const sig = fromHex(sigHex);
  if (!sig) return false;
  // subtle.verify compares the MAC in constant time
  return crypto.subtle.verify("HMAC", await hmacKey(cfg.secret, "verify"), sig as BufferSource, enc.encode(`${expiry}.${nonce}`));
}
