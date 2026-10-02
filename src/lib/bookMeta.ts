// Client-safe book metadata (no server imports).
export type BookLanguage = "si" | "en" | "ta";
export const LANGUAGE_LABELS: Record<BookLanguage, string> = { si: "Sinhala", en: "English", ta: "Tamil" };
