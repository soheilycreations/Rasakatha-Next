// Normalizes a Sri Lankan phone number for matching across web orders and
// POS sales (strips formatting, collapses the +94 country code to a leading 0).
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^94/, "0");
}
