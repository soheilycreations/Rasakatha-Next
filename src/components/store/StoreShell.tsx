"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { CatalogBook } from "@/lib/catalog";
import type { CartItem } from "@/lib/cart";
import type { Account } from "@/lib/account";
import type { Customer, StoredOrder } from "@/lib/orders";
import { bookHref, ROUTES } from "@/lib/links";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import SearchResults from "./SearchResults";
import AuthModal from "./AuthModal";
import { submitPayHereForm } from "@/lib/payhere-client";
import { trackAddToCart } from "@/lib/analytics";
import FlyToCartLayer from "./FlyToCartLayer";
import { StoreContext, type StoreState } from "./StoreContext";
import { IconHome, IconCategories, IconHeart, IconCart } from "./icons";

const WISH_STORAGE_KEY = "rasakatha:wishlist";
const CART_STORAGE_KEY = "rasakatha:cart";

const NAV_ROUTES: Record<string, string> = {
  Home: ROUTES.home,
  Categories: ROUTES.categories,
  "My Library": ROUTES.library,
};

function navForPath(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/categor")) return "Categories";
  if (pathname.startsWith("/library")) return "My Library";
  return "";
}

// The shell wraps every page from the root layout; the admin panel has its own
// chrome, so it is passed through untouched.
export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  return <StorefrontShell>{children}</StorefrontShell>;
}

function StorefrontShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [wish, setWish] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<StoredOrder | undefined>(undefined);
  const [toast, setToast] = useState<string>("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Leaving a page clears the inline search and scrolls the new page to the top.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setQuery("");
    setMobileNavOpen(false);
  }
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((a: Account | null) => setAccount(a))
      .catch(() => {});
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const state = useMemo<StoreState>(() => {
    const addToCart = (item: Omit<CartItem, "qty">) => {
      setCart((c) => {
        const existing = c.find((x) => x.id === item.id);
        if (existing) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
        return [...c, { ...item, qty: 1 }];
      });
      notify(`Added to cart — ${item.title.split("|")[0].trim()}`);
    };

    return {
      wish,
      toggleWish: (id) => {
        const saving = !wish[id];
        setWish((w) => ({ ...w, [id]: !w[id] }));
        notify(saving ? "Saved to My Library" : "Removed from My Library");
      },
      cart,
      addToCart,
      addBookToCart: (book: CatalogBook) => {
        trackAddToCart({
          id: book.id,
          title: book.title,
          price: book.onSale && book.salePrice ? book.salePrice : book.regularPrice,
          category: book.category,
        });
        addToCart({
          id: book.id,
          title: book.title,
          author: book.author,
          cover: book.cover,
          price: book.onSale && book.salePrice ? book.salePrice : book.regularPrice,
          weight: book.weight,
        });
      },
      removeFromCart: (id) => setCart((c) => c.filter((x) => x.id !== id)),
      changeCartQty: (id, delta) =>
        setCart((c) =>
          c.map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0)
        ),
      openBook: (book) => router.push(bookHref(book)),
      account,
      setAccount,
      openAuth: () => setAuthOpen(true),
      signOut: async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setAccount(null);
        router.push(ROUTES.home);
      },
      placedOrder,
      placeOrder: async (payment: string, customer: Customer) => {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.map((x) => ({ id: x.id, qty: x.qty })),
            payment,
            customer,
          }),
        });
        const data = await res.json().catch(() => ({}));
        // Keep the cart if anything went wrong so the customer can retry.
        if (!res.ok) throw new Error(data.error || "We couldn't place your order. Please try again.");
        const { payhere, ...order } = data as StoredOrder & { payhere?: { action: string; fields: Record<string, string> } };
        setPlacedOrder(order);
        setCart([]);
        // Online payment: hand the customer to PayHere with the server-signed form.
        if (payhere) {
          submitPayHereForm(payhere);
          return;
        }
        router.push(ROUTES.thankYou);
      },
      notify,
    };
  }, [wish, cart, account, placedOrder, router, notify]);

  const searching = query.trim().length > 0;
  const nav = navForPath(pathname);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);
  const wishCount = Object.values(wish).filter(Boolean).length;

  const sidebarProps = {
    nav,
    onNavSelect: (label: string) => router.push(NAV_ROUTES[label] ?? ROUTES.home),
    onOpenBook: (book: { id: string; title: string }) => router.push(bookHref(book)),
  };

  return (
    <StoreContext.Provider value={state}>
      <div className="app-backdrop flex min-h-dvh justify-center p-0">
        <FlyToCartLayer />
        {authOpen && (
          <AuthModal
            onClose={() => setAuthOpen(false)}
            onAuthed={(a) => {
              setAccount(a);
              setAuthOpen(false);
              router.push(ROUTES.account);
            }}
          />
        )}
        <div className="flex h-dvh w-full overflow-hidden bg-panel">
          <Sidebar {...sidebarProps} />

          {mobileNavOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileNavOpen(false)}
              />
              <div className="relative flex">
                <Sidebar variant="drawer" {...sidebarProps} />
              </div>
            </div>
          )}

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <TopBar
              query={query}
              onQueryChange={setQuery}
              cartItems={cart}
              onRemoveFromCart={state.removeFromCart}
              onChangeCartQty={state.changeCartQty}
              onViewCart={() => router.push(ROUTES.cart)}
              onCheckout={() => router.push(ROUTES.checkout)}
              wishCount={wishCount}
              onOpenLibrary={() => router.push(ROUTES.library)}
              onMenuClick={() => setMobileNavOpen(true)}
              account={account}
              onProfileClick={() => (account ? router.push(ROUTES.account) : setAuthOpen(true))}
            />

            <div ref={scrollRef} className="flex-1 overflow-y-auto pb-20 md:pb-4">
              {searching ? (
                <div className="px-4 pt-4 sm:px-8">
                  <SearchResults
                    query={query}
                    wish={wish}
                    onToggleWish={state.toggleWish}
                    onAdd={state.addBookToCart}
                    onOpen={state.openBook}
                  />
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>

        {/* Mobile bottom navigation — thumb-reachable shortcuts to the key pages. */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border)] bg-[var(--panel)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        >
          {[
            { href: ROUTES.home, label: "Home", Icon: IconHome, active: nav === "Home" },
            { href: ROUTES.categories, label: "Categories", Icon: IconCategories, active: nav === "Categories" },
            { href: ROUTES.library, label: "Library", Icon: IconHeart, active: nav === "My Library", badge: wishCount },
            { href: ROUTES.cart, label: "Cart", Icon: IconCart, active: pathname === ROUTES.cart, badge: cartCount },
          ].map(({ href, label, Icon, active, badge }) => (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold"
              style={{ color: active ? "#EF4238" : "var(--ink-faint)" }}
            >
              <span className="relative grid h-5 w-5 place-items-center">
                <Icon className="h-[19px] w-[19px]" />
                {!!badge && (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9.5px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </Link>
          ))}
        </nav>

        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-none fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-[13px] font-semibold text-[var(--panel)] shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 md:bottom-8 ${
            toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {toast}
        </div>
      </div>
    </StoreContext.Provider>
  );
}
