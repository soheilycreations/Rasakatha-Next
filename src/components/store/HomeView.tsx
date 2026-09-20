import type { CatalogBook } from "@/lib/catalog";
import type { CartItem } from "@/lib/cart";
import HeroCarousel from "./HeroCarousel";
import CategoryTiles from "./CategoryTiles";
import HomeRow from "./HomeRow";
import AboutBanner from "./AboutBanner";
import Footer from "./Footer";

export default function HomeView({
  wish,
  onToggleWish,
  onAdd,
  onOpen,
  onBuyHero,
  onSelectCategory,
  onTrackOrder,
}: {
  wish: Record<string, boolean>;
  onToggleWish: (id: string) => void;
  onAdd: (book: CatalogBook) => void;
  onOpen: (book: CatalogBook) => void;
  onBuyHero: (item: Omit<CartItem, "qty">) => void;
  onSelectCategory: (name: string) => void;
  onTrackOrder: () => void;
}) {
  return (
    <div className="pt-4">
      <HeroCarousel wish={wish} onToggleWish={onToggleWish} onBuy={onBuyHero} />

      <CategoryTiles onSelect={onSelectCategory} />

      <HomeRow
        title="New Arrivals"
        fetchUrl="/api/books?sort=new&limit=16"
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
      />

      <HomeRow
        title="From Rasakatha Publishers"
        fetchUrl="/api/books?publisher=RasaKatha&limit=16"
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
      />

      <AboutBanner />

      <HomeRow
        title="Books on Sale"
        fetchUrl="/api/books?category=__sale__&limit=16"
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
      />

      <HomeRow
        title="Novels"
        fetchUrl="/api/books?category=Novel&limit=16"
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        onViewAll={() => onSelectCategory("Novel")}
      />

      <HomeRow
        title="Poetry Collection"
        fetchUrl="/api/books?category=Poetry&limit=16"
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        onViewAll={() => onSelectCategory("Poetry")}
      />

      <HomeRow
        title="Children's Books"
        fetchUrl="/api/books?category=Children&limit=16"
        wish={wish}
        onToggleWish={onToggleWish}
        onAdd={onAdd}
        onOpen={onOpen}
        onViewAll={() => onSelectCategory("Children")}
      />

      <Footer onTrackOrder={onTrackOrder} />
    </div>
  );
}
