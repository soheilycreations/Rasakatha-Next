// Money rules (Admin v2): the database stores numeric(12,2); TypeScript calculations use integer
// cents so rounding never drifts; there is ONE display formatter, money().

export type Cents = number; // integer, 1 rupee = 100 cents

export function toCents(rupees: number | string): Cents {
  const n = typeof rupees === "string" ? Number(rupees) : rupees;
  if (!Number.isFinite(n)) throw new Error("Not a money amount");
  return Math.round(n * 100);
}

export function fromCents(cents: Cents): number {
  return Math.round(cents) / 100;
}

export const addCents = (...xs: Cents[]): Cents => xs.reduce((a, b) => a + b, 0);
export const mulCents = (cents: Cents, qty: number): Cents => Math.round(cents * qty);

// Percentage of an amount, rounded half-up to the nearest cent (e.g. a 10% discount).
export function percentOfCents(cents: Cents, percent: number): Cents {
  return Math.round((cents * percent) / 100);
}

// Splits an amount into n parts that add back to exactly the amount (remainder cents go first).
export function allocateCents(total: Cents, parts: number): Cents[] {
  const base = Math.floor(total / parts);
  const rest = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < rest ? 1 : 0));
}

// The one display formatter: whole rupees when there are no cents, otherwise two decimals.
export function money(n: number): string {
  const whole = Number.isInteger(Math.round(n * 100) / 100) && Math.round(n * 100) % 100 === 0;
  return (
    "Rs. " +
    (whole
      ? Math.round(n).toLocaleString("en-US")
      : (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  );
}
