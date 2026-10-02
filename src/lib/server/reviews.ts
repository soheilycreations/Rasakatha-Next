import { supabase } from "./supabase";
import { invalidateCatalog } from "@/lib/catalog";

// books.rating is the average of the approved reviews (0 when there are none).
export async function syncBookRating(bookId: string): Promise<void> {
  const { data } = await supabase().from("reviews").select("rating").eq("book_id", bookId).eq("approved", true);
  const list = data ?? [];
  const avg = list.length ? list.reduce((s, r) => s + Number(r.rating), 0) / list.length : 0;
  await supabase().from("books").update({ rating: Math.round(avg * 100) / 100 }).eq("id", bookId);
  invalidateCatalog();
}
