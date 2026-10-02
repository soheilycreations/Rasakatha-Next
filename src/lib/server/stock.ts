import { supabase } from "./supabase";
import { invalidateCatalog } from "@/lib/catalog";

const isMissingColumn = (code?: string) => code === "42703" || code === "PGRST204";

// Decrements books.stock_qty for tracked books (stock_qty not null) and flips
// in_stock to false at zero. Uses a compare-and-set so two simultaneous orders
// can't both take the last copy's count below what was actually sold.
// Silently does nothing when supabase/stock.sql hasn't been run yet.
export async function decrementStock(items: { id: string; qty: number }[]): Promise<void> {
  let changed = false;
  for (const { id, qty } of items) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await supabase().from("books").select("stock_qty").eq("id", id).maybeSingle();
      if (error) {
        if (!isMissingColumn(error.code)) console.error("[stock] read failed", error.message);
        return;
      }
      const current = data?.stock_qty;
      if (current == null) break; // not tracked
      const next = Math.max(0, current - qty);
      const { data: updated, error: upErr } = await supabase()
        .from("books")
        .update(next === 0 ? { stock_qty: 0, in_stock: false } : { stock_qty: next })
        .eq("id", id)
        .eq("stock_qty", current)
        .select("id");
      if (upErr) {
        console.error("[stock] update failed", upErr.message);
        break;
      }
      if (updated && updated.length > 0) {
        changed = true;
        break;
      }
      // someone else changed it first; re-read and retry
    }
  }
  if (changed) invalidateCatalog();
}
