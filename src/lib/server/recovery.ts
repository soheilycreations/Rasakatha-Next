import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

// One-time recovery codes for 2FA (used when the authenticator phone is lost).
// 10 codes like "K7QF3-MD9XB" (10 characters from an alphabet without look-alikes, about 50 bits each).
// They are shown ONCE at setup; only HMAC hashes are stored, and each code works a single time.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const RECOVERY_CODE_COUNT = 10;
// 5 letters/digits, dash, 5 letters/digits (case-insensitive when typed)
export const RECOVERY_CODE_PATTERN = /^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/;

function pepper(): Buffer {
  const k = process.env.ADMIN_ENCRYPTION_KEY || process.env.ADMIN_SESSION_SECRET || "dev-only-secret-change-me";
  return createHash("sha256").update(`recovery:${k}`).digest();
}

export const normalizeRecoveryCode = (code: string) => code.replace(/[\s-]/g, "").toUpperCase();

export function hashRecoveryCode(code: string, staffId: string): string {
  return createHmac("sha256", pepper()).update(`${staffId}:${normalizeRecoveryCode(code)}`).digest("hex");
}

export function generateRecoveryCodes(staffId: string): { codes: string[]; hashes: string[] } {
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
  return { codes, hashes: codes.map((c) => hashRecoveryCode(c, staffId)) };
}

// Returns the remaining hashes if the code matched (one-time use), or null if it did not match.
export function consumeRecoveryCode(code: string, staffId: string, hashes: string[]): string[] | null {
  if (!RECOVERY_CODE_PATTERN.test(code.trim())) return null;
  const given = Buffer.from(hashRecoveryCode(code, staffId), "hex");
  let matched = -1;
  hashes.forEach((h, i) => {
    const stored = Buffer.from(h, "hex");
    if (stored.length === given.length && timingSafeEqual(stored, given)) matched = i;
  });
  return matched === -1 ? null : hashes.filter((_, i) => i !== matched);
}
