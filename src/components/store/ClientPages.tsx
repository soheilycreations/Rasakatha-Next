"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/lib/links";
import { useCardHandlers, useStore } from "./StoreContext";
import LibraryView from "./LibraryView";
import CartPage from "./CartPage";
import CheckoutPage from "./CheckoutPage";
import ThankYouPage from "./ThankYouPage";
import TrackOrderView from "./TrackOrderView";
import ProfileView from "./ProfileView";

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-4 sm:px-8">{children}</div>;
}

export function LibraryClient() {
  const handlers = useCardHandlers();
  return (
    <Pad>
      <LibraryView {...handlers} />
    </Pad>
  );
}

export function CartClient() {
  const router = useRouter();
  const s = useStore();
  return (
    <Pad>
      <CartPage
        items={s.cart}
        onRemove={s.removeFromCart}
        onChangeQty={s.changeCartQty}
        onCheckout={() => router.push(ROUTES.checkout)}
        onContinueShopping={() => router.push(ROUTES.home)}
      />
    </Pad>
  );
}

export function CheckoutClient({ methods }: { methods: string[] }) {
  const router = useRouter();
  const s = useStore();
  return (
    <Pad>
      <CheckoutPage
        key={s.account?.id ?? "guest"}
        account={s.account}
        items={s.cart}
        methods={methods}
        onPlaceOrder={s.placeOrder}
        onBack={() => router.push(ROUTES.cart)}
      />
    </Pad>
  );
}

export function ThankYouClient() {
  const router = useRouter();
  const s = useStore();
  if (!s.placedOrder) {
    return (
      <Pad>
        <div className="py-16 text-center">
          <h1 className="font-display text-xl font-bold text-[var(--ink)]">Looking for your order?</h1>
          <p className="mt-2 text-[13.5px] text-[var(--ink-faint)]">
            Use your order number and phone number to check its status.
          </p>
          <Link href={ROUTES.track} className="btn-accent mt-5 inline-block rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
            Track an order
          </Link>
        </div>
      </Pad>
    );
  }
  return (
    <Pad>
      <ThankYouPage
        order={s.placedOrder}
        onContinueShopping={() => router.push(ROUTES.home)}
        onTrackOrder={() => router.push(ROUTES.track)}
      />
    </Pad>
  );
}

export function TrackClient() {
  const s = useStore();
  return (
    <Pad>
      <TrackOrderView initialOrder={s.placedOrder} />
    </Pad>
  );
}

export function AccountClient() {
  const s = useStore();
  if (!s.account) {
    return (
      <Pad>
        <div className="py-16 text-center">
          <h1 className="font-display text-xl font-bold text-[var(--ink)]">Your account</h1>
          <p className="mt-2 text-[13.5px] text-[var(--ink-faint)]">Sign in to see your orders and saved details.</p>
          <button onClick={s.openAuth} className="btn-accent mt-5 rounded-full px-6 py-3 text-[13.5px] font-bold text-white">
            Sign in or create an account
          </button>
        </div>
      </Pad>
    );
  }
  return (
    <Pad>
      <ProfileView account={s.account} onUpdated={s.setAccount} onSignOut={s.signOut} />
    </Pad>
  );
}
