import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// RFC 6238 TOTP (SHA-1, 6 digits, 30 s) compatible with Google Authenticator, Authy, 1Password...

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(s: string): Buffer {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function totpAt(secret: string, timeMs: number = Date.now()): string {
  const counter = Math.floor(timeMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(buf).digest();
  const offset = h[h.length - 1] & 0xf;
  const code = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

// Accepts the previous, current and next 30 s window (clock drift).
export function verifyTotp(secret: string, code: string, timeMs: number = Date.now()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  let ok = false;
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(totpAt(secret, timeMs + drift * 30_000));
    const given = Buffer.from(code);
    if (expected.length === given.length && timingSafeEqual(expected, given)) ok = true;
  }
  return ok;
}

export function otpauthUrl(secret: string, email: string, issuer = "Rasakatha"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;
}

// TOTP secrets are stored encrypted (AES-256-GCM, key derived from ADMIN_SESSION_SECRET).
function aesKey(): Buffer {
  const s = process.env.ADMIN_SESSION_SECRET || "dev-only-secret-change-me";
  return createHash("sha256").update(`totp:${s}`).digest();
}
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", aesKey(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decryptSecret(stored: string): string | null {
  try {
    const [iv, tag, enc] = stored.split(".").map((p) => Buffer.from(p, "base64"));
    const d = createDecipheriv("aes-256-gcm", aesKey(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
