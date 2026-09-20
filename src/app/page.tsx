import StoreApp from "@/components/store/StoreApp";
import { getHeroSlides } from "@/lib/server/heroSlides";

export const dynamic = "force-dynamic";

export default async function Home() {
  const slides = await getHeroSlides();
  return <StoreApp slides={slides} />;
}
