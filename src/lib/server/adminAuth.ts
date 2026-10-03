// Staff sessions: a signed, expiring cookie (HMAC-SHA256) carrying who the staff member is and
// their role. Web Crypto only, so it runs in the proxy and in route handlers alike.
//
// Token = base64url(JSON payload) + "." + hex(HMAC(payload)). The role in the cookie is what the
// proxy uses for the route gate; route handlers additionally re-check the staff record (active?
// still that role?) so a deactivated account stops working within seconds.
//
// In production ADMIN_SESSION_SECRET (16+ chars) is required; without it no session is valid.
// ADMIN_PASSWORD is only for the emergency owner login (see emergencyLoginAllowed in staff.ts).

import type { Role } from "@/lib/permissions";

export const ADMIN_COOKIE = "rk_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // a working day
export const TICKET_MAX_AGE_SECONDS = 60 * 5; // password step -> 2FA code

export type Session = {
  v: 2;
  sid: string; // staff id (uuid), or "emergency"
  role: Role;
  name: string;
  exp: number; // unix seconds
  tf: boolean; // true = no 2FA needed, or 2FA done. false = owner/manager who must set up 2FA first
  n: string; // nonce
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < 16) {
      console.error("[admin] ADMIN_SESSION_SECRET (16+ chars) must be set in production");
      return null;
    }
    return s;
  }
  return s || "dev-only-secret-change-me";
}

export function isAdminConfigured(): boolean {
  return secret() !== null;
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

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function unb64url(s: string): Uint8Array | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function key(usage: "sign" | "verify") {
  return crypto.subtle.importKey("raw", enc.encode(secret()!), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

async function sign(payload: object): Promise<string> {
  if (!secret()) throw new Error("Admin auth is not configured");
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await key("sign"), enc.encode(body));
  return `${body}.${toHex(sig)}`;
}

async function open<T extends { exp: number }>(token: string | undefined): Promise<T | null> {
  if (!secret() || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const sig = fromHex(parts[1]);
  if (!sig) return null;
  // subtle.verify compares the MAC in constant time
  const ok = await crypto.subtle.verify("HMAC", await key("verify"), sig as BufferSource, enc.encode(parts[0]));
  if (!ok) return null;
  const raw = unb64url(parts[0]);
  if (!raw) return null;
  try {
    const payload = JSON.parse(dec.decode(raw)) as T;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

const nonce = () => toHex(crypto.getRandomValues(new Uint8Array(12)).buffer as ArrayBuffer);

export async function createSession(input: { sid: string; role: Role; name: string; tf: boolean }): Promise<string> {
  const session: Session = { v: 2, ...input, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS, n: nonce() };
  return sign(session);
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  const s = await open<Session>(token);
  return s && s.v === 2 ? s : null;
}

// Short-lived proof that the password step succeeded, exchanged for a session after the 2FA code.
export async function createTicket(sid: string): Promise<string> {
  return sign({ p: "2fa", sid, exp: Math.floor(Date.now() / 1000) + TICKET_MAX_AGE_SECONDS, n: nonce() });
}
export async function readTicket(token: string): Promise<string | null> {
  const t = await open<{ p: string; sid: string; exp: number }>(token);
  return t && t.p === "2fa" ? t.sid : null;
}

// Constant-time string compare (for the emergency password): compares SHA-256 digests byte by byte.
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const p = new Uint8Array(x);
  const q = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < p.length; i++) diff |= p[i] ^ q[i];
  return diff === 0;
}
