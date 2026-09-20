"use client";

import { useEffect, useState } from "react";
import type { CatalogBook } from "@/lib/catalog";
import type { CartItem } from "@/lib/cart";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import HomeView from "./HomeView";
import CategoriesView from "./CategoriesView";
import SearchResults from "./SearchResults";
import LibraryView from "./LibraryView";
import AuthorView from "./AuthorView";
import ProductView from "./ProductView";
import CartPage from "./CartPage";
import CheckoutPage from "./CheckoutPage";
import ThankYouPage from "./ThankYouPage";
import TrackOrderView from "./TrackOrderView";
import FlyToCartLayer from "./FlyToCartLayer";
import type { Customer, StoredOrder } from "@/lib/orders";
import type { HeroSlide } from "@/lib/hero-slides";

const WISH_STORAGE_KEY = "rasakatha:wishlist";
const CART_STORAGE_KEY = "rasakatha:cart";

export default function StoreApp({ slides }: { slides: HeroSlide[] }) {
  const [nav, setNav] = useState("Home");
  const [pendingCategory, setPendingCategory] = useState<string | undefined>(undefined);
  const [pendingAuthor, setPendingAuthor] = useState<string | undefined>(undefined);
  const [pendingProduct, setPendingProduct] = useState<string | undefined>(undefined);
  const [productOrigin, setProductOrigin] = useState("Home");
  const [placedOrder, setPlacedOrder] = useState<StoredOrder | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [wish, setWish] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedWish = localStorage.getItem(WISH_STORAGE_KEY);
        if (savedWish) setWish(JSON.parse(savedWish));
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) setCart(JSON.parse(savedCart));
      } catch {
        // ignore malformed/unavailable storage
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(WISH_STORAGE_KEY, JSON.stringify(wish));
    } catch {
      // storage unavailable (private mode, quota) — wishlist just won't persist
    }
  }, [wish, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // storage unavailable (private mode, quota) — cart just won't persist
    }
  }, [cart, hydrated]);

  const toggleWish = (key: string) => setWish((w) => ({ ...w, [key]: !w[key] }));

  const addToCart = (item: Omit<CartItem, "qty">) =>
    setCart((c) => {
      const existing = c.find((x) => x.id === item.id);
      if (existing) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });

  const addBookToCart = (book: CatalogBook) =>
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      price: book.onSale && book.salePrice ? book.salePrice : book.regularPrice,
      weight: book.weight,
    });

  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

  const changeCartQty = (id: string, delta: number) =>
    setCart((c) =>
      c
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );

  const goToCategory = (name: string) => {
    setPendingCategory(name);
    setNav("Categories");
  };

  const goToAuthor = (name: string) => {
    setPendingAuthor(name);
    setNav("Author");
  };

  const goToProduct = (book: CatalogBook) => {
    setProductOrigin((current) => (nav === "Product" ? current : nav));
    setPendingProduct(book.id);
    setNav("Product");
  };

  const goToCart = () => setNav("Cart");
  const goToCheckout = () => setNav("Checkout");

  const handlePlaceOrder = async (payment: string, deliveryFee: number, customer: Customer) => {
    const subtotal = cart.reduce((sum, x) => sum + (x.price ?? 0) * x.qty, 0);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        payment,
        customer,
      }),
    });
    const order: StoredOrder = await res.json();
    setPlacedOrder(order);
    setCart([]);
    setNav("ThankYou");
  };

  const searching = query.trim().length > 0;

  return (
    <div className="app-backdrop flex min-h-screen justify-center p-0">
      <FlyToCartLayer />
      <div className="flex h-screen w-full min-h-[660px] overflow-hidden bg-panel">
        <Sidebar
          nav={nav}
          onNavSelect={(l) => {
            if (l !== "Categories") setPendingCategory(undefined);
            setNav(l);
          }}
          onSelectAuthor={goToAuthor}
        />

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
            <div className="relative flex">
              <Sidebar
                variant="drawer"
                nav={nav}
                onNavSelect={(l) => {
                  if (l !== "Categories") setPendingCategory(undefined);
                  setNav(l);
                  setMobileNavOpen(false);
                }}
                onSelectAuthor={(name) => {
                  goToAuthor(name);
                  setMobileNavOpen(false);
                }}
              />
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar
            query={query}
            onQueryChange={setQuery}
            cartItems={cart}
            onRemoveFromCart={removeFromCart}
            onChangeCartQty={changeCartQty}
            onViewCart={goToCart}
            onCheckout={goToCheckout}
            wishCount={Object.values(wish).filter(Boolean).length}
            onOpenLibrary={() => {
              setPendingCategory(undefined);
              setNav("My Library");
            }}
            onMenuClick={() => setMobileNavOpen(true)}
          />

          <div className="flex-1 overflow-y-auto pb-4">
            {searching ? (
              <div className="px-6 pt-4 sm:px-8">
                <SearchResults
                  query={query}
                  wish={wish}
                  onToggleWish={toggleWish}
                  onAdd={addBookToCart}
                  onOpen={goToProduct}
                />
              </div>
            ) : nav === "Categories" ? (
              <div className="px-6 pt-4 sm:px-8">
                <CategoriesView
                  key={pendingCategory ?? "__default__"}
                  initialCategory={pendingCategory}
                  wish={wish}
                  onToggleWish={toggleWish}
                  onAdd={addBookToCart}
                  onOpen={goToProduct}
                />
              </div>
            ) : nav === "My Library" ? (
              <div className="px-6 pt-4 sm:px-8">
                <LibraryView wish={wish} onToggleWish={toggleWish} onAdd={addBookToCart} onOpen={goToProduct} />
              </div>
            ) : nav === "Author" && pendingAuthor ? (
              <div className="px-6 pt-4 sm:px-8">
                <AuthorView
                  key={pendingAuthor}
                  author={pendingAuthor}
                  wish={wish}
                  onToggleWish={toggleWish}
                  onAdd={addBookToCart}
                  onOpen={goToProduct}
                />
              </div>
            ) : nav === "Product" && pendingProduct ? (
              <div className="px-6 pt-4 sm:px-8">
                <ProductView
                  key={pendingProduct}
                  bookId={pendingProduct}
                  wish={wish}
                  onToggleWish={toggleWish}
                  onAdd={addBookToCart}
                  onOpen={goToProduct}
                  onOpenAuthor={goToAuthor}
                  onBack={() => setNav(productOrigin)}
                />
              </div>
            ) : nav === "Cart" ? (
              <div className="px-6 pt-4 sm:px-8">
                <CartPage
                  items={cart}
                  onRemove={removeFromCart}
                  onChangeQty={changeCartQty}
                  onCheckout={goToCheckout}
                  onContinueShopping={() => setNav("Home")}
                />
              </div>
            ) : nav === "Checkout" ? (
              <div className="px-6 pt-4 sm:px-8">
                <CheckoutPage items={cart} onPlaceOrder={handlePlaceOrder} onBack={goToCart} />
              </div>
            ) : nav === "ThankYou" && placedOrder ? (
              <div className="px-6 pt-4 sm:px-8">
                <ThankYouPage order={placedOrder} onContinueShopping={() => setNav("Home")} onTrackOrder={() => setNav("Track")} />
              </div>
            ) : nav === "Track" ? (
              <div className="px-6 pt-4 sm:px-8">
                <TrackOrderView initialOrder={placedOrder} />
              </div>
            ) : (
              <HomeView
                slides={slides}
                wish={wish}
                onToggleWish={toggleWish}
                onAdd={addBookToCart}
                onOpen={goToProduct}
                onBuyHero={addToCart}
                onSelectCategory={goToCategory}
                onTrackOrder={() => setNav("Track")}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
