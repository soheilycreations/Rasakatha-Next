import raw from "./data/hero-slides.json";

export type HeroSlide = {
  id: string;
  title: string;
  cover: string;
  author?: string;
  price?: number;
};

export const HERO_SLIDES: HeroSlide[] = raw as HeroSlide[];
