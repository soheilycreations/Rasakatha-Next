import { supabase } from "./supabase";
import type { HeroSlide } from "@/lib/hero-slides";

type Row = { id: string; title: string; cover: string; author: string | null; price: number | null };

export function rowToSlide(r: Row): HeroSlide {
  return {
    id: r.id,
    title: r.title,
    cover: r.cover,
    ...(r.author ? { author: r.author } : {}),
    ...(r.price != null ? { price: Number(r.price) } : {}),
  };
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const { data, error } = await supabase().from("hero_slides").select("*").order("position");
  if (error) throw new Error(`Failed to load hero slides: ${error.message}`);
  return (data as Row[]).map(rowToSlide);
}
