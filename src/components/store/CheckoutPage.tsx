"use client";

import { useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart";
import { money, tintForId } from "@/lib/format";
import { SRI_LANKA_LOCATIONS, calculateShippingFee } from "@/lib/shipping";
import type { Customer } from "@/lib/orders";
import type { Account } from "@/lib/account";
import BookCover from "./BookCover";
import { IconTruck, IconHeart } from "./icons";

type PaymentMethod = {
  id: string;
  title: string;
  description: string;
  badge: string;
  badgeBg: string;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "cod", title: "Cash on Delivery", description: "Pay with cash upon delivery.", badge: "COD", badgeBg: "#2f5a3a" },
  {
    id: "payhere",
    title: "PayHere",
    description: "Pay by Visa, MasterCard, AMEX, eZcash, mCash or Internet Banking via PayHere.",
    badge: "PH",
    badgeBg: "#00aef0",
  },
  {
    id: "koko",
    title: "Koko: Buy Now Pay Later",
    description: "Pay in 3 interest-free installments with Koko.",
    badge: "KO",
    badgeBg: "#7c1c18",
  },
  { id: "mintpay", title: "MintPay", description: "Pay in easy installments with MintPay.", badge: "MP", badgeBg: "#155158" },
];

const DEFAULT_ITEM_WEIGHT = 303;

function LocationSelect({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] focus:outline-none focus:border-accent/50 transition-colors ${
        hasError ? "border-accent" : "border-[var(--border)]"
      }`}
    >
      <option value="" style={{ color: "#111", background: "#fff" }}>
        Select delivery city / town
      </option>
      {SRI_LANKA_LOCATIONS.map((d) => (
        <optgroup key={d.name} label={d.name} style={{ color: "#111", background: "#fff" }}>
          {d.towns.map((t) => (
            <option key={t} value={t} style={{ color: "#111", background: "#fff" }}>
              {t}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function CheckoutPage({
  account,
  items,
  onPlaceOrder,
  onBack,
}: {
  account: Account | null;
  items: CartItem[];
  onPlaceOrder: (payment: string, deliveryFee: number, customer: Customer) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(account?.name ?? "");
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [giftPhone, setGiftPhone] = useState("");
  const [giftAddress, setGiftAddress] = useState("");
  const [giftCity, setGiftCity] = useState("");
  const [payment, setPayment] = useState("cod");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  const subtotal = items.reduce((sum, x) => sum + (x.price ?? 0) * x.qty, 0);
  const totalWeight = items.reduce((sum, x) => sum + (x.weight ?? DEFAULT_ITEM_WEIGHT) * x.qty, 0);
  const deliveryCity = isGift ? giftCity : city;
  const deliveryFee = useMemo(
    () => (deliveryCity && subtotal > 0 ? calculateShippingFee(deliveryCity, totalWeight) : 0),
    [deliveryCity, totalWeight, subtotal]
  );
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Enter your full name";
    if (!email.trim()) nextErrors.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email address";
    if (!phone.trim()) nextErrors.phone = "Enter a contact number";
    if (!city) nextErrors.city = "Select your city";
    if (!address.trim()) nextErrors.address = "Enter your address";
    if (isGift) {
      if (!giftName.trim()) nextErrors.giftName = "Enter recipient's name";
      if (!giftPhone.trim()) nextErrors.giftPhone = "Enter recipient's phone number";
      if (!giftAddress.trim()) nextErrors.giftAddress = "Enter recipient's delivery address";
      if (!giftCity) nextErrors.giftCity = "Select recipient's city";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const customer: Customer = {
      name,
      phone,
      email,
      city,
      address,
      isGift,
      ...(isGift ? { giftName, giftPhone, giftCity, giftAddress } : {}),
    };

    setPlacing(true);
    setTimeout(() => onPlaceOrder(payment, deliveryFee, customer), 500);
  };

  const inputClass =
    "w-full rounded-xl border bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent/50 transition-colors";

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 text-[13px] font-semibold text-[var(--ink-dim)] transition-colors hover:text-accent"
      >
        ← Back to Cart
      </button>

      <h3 className="font-display mb-6 text-xl font-bold text-[var(--ink)]">Checkout</h3>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-[var(--ink)]">
              <IconTruck className="h-4 w-4 text-accent" />
              Your Details
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={`${inputClass} ${errors.name ? "border-accent" : "border-[var(--border)]"}`}
                />
                {errors.name && <p className="mt-1 text-[11.5px] text-accent">{errors.name}</p>}
              </div>
              <div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className={`${inputClass} ${errors.phone ? "border-accent" : "border-[var(--border)]"}`}
                />
                {errors.phone && <p className="mt-1 text-[11.5px] text-accent">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  type="email"
                  className={`${inputClass} ${errors.email ? "border-accent" : "border-[var(--border)]"}`}
                />
                {errors.email && <p className="mt-1 text-[11.5px] text-accent">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <LocationSelect value={city} onChange={setCity} hasError={!!errors.city} />
                {errors.city && <p className="mt-1 text-[11.5px] text-accent">{errors.city}</p>}
              </div>
              <div className="sm:col-span-2">
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isGift ? "Your address (for billing / contact purposes)" : "Delivery address"}
                  rows={isGift ? 2 : 3}
                  className={`${inputClass} resize-none ${errors.address ? "border-accent" : "border-[var(--border)]"}`}
                />
                {errors.address && <p className="mt-1 text-[11.5px] text-accent">{errors.address}</p>}
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] p-3.5">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-accent"
            />
            <IconHeart className="h-4 w-4 shrink-0 text-accent" />
            <div>
              <div className="text-[13.5px] font-semibold text-[var(--ink)]">Send this as a gift</div>
              <div className="text-[11.5px] text-[var(--ink-faint)]">
                Deliver to someone else&apos;s address instead of your own.
              </div>
            </div>
          </label>

          {isGift && (
            <div className="rounded-2xl border border-accent/30 bg-accent/[0.04] p-4">
              <h4 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-[var(--ink)]">
                <IconHeart className="h-4 w-4 text-accent" />
                Recipient&apos;s Delivery Details
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                    placeholder="Recipient's full name"
                    className={`${inputClass} ${errors.giftName ? "border-accent" : "border-[var(--border)]"}`}
                  />
                  {errors.giftName && <p className="mt-1 text-[11.5px] text-accent">{errors.giftName}</p>}
                </div>
                <div>
                  <input
                    value={giftPhone}
                    onChange={(e) => setGiftPhone(e.target.value)}
                    placeholder="Recipient's phone number"
                    className={`${inputClass} ${errors.giftPhone ? "border-accent" : "border-[var(--border)]"}`}
                  />
                  {errors.giftPhone && <p className="mt-1 text-[11.5px] text-accent">{errors.giftPhone}</p>}
                </div>
                <div className="sm:col-span-2">
                  <LocationSelect value={giftCity} onChange={setGiftCity} hasError={!!errors.giftCity} />
                  {errors.giftCity && <p className="mt-1 text-[11.5px] text-accent">{errors.giftCity}</p>}
                </div>
                <div className="sm:col-span-2">
                  <textarea
                    value={giftAddress}
                    onChange={(e) => setGiftAddress(e.target.value)}
                    placeholder="Recipient's delivery address"
                    rows={3}
                    className={`${inputClass} resize-none ${errors.giftAddress ? "border-accent" : "border-[var(--border)]"}`}
                  />
                  {errors.giftAddress && <p className="mt-1 text-[11.5px] text-accent">{errors.giftAddress}</p>}
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-3 text-[15px] font-bold text-[var(--ink)]">Payment Method</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => {
                const selected = payment === m.id;
                return (
                  <label
                    key={m.id}
                    className={`group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                      selected
                        ? "border-accent bg-accent/[0.06] shadow-[0_10px_28px_-14px_rgba(239,66,56,0.55)]"
                        : "border-[var(--border)] bg-[var(--surface-tint)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-tint-strong)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={selected}
                      onChange={() => setPayment(m.id)}
                      className="sr-only"
                    />
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] transition-opacity ${
                        selected ? "opacity-100" : "opacity-0"
                      }`}
                      style={{ background: m.badgeBg }}
                    />
                    <div className="flex items-center justify-between">
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[11.5px] font-extrabold text-white shadow-[0_6px_14px_-6px_rgba(0,0,0,0.4)]"
                        style={{ background: m.badgeBg }}
                      >
                        {m.badge}
                      </div>
                      <div
                        className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors ${
                          selected ? "border-accent bg-accent" : "border-[var(--border-strong)] bg-transparent"
                        }`}
                      >
                        {selected && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="h-3 w-3">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-[var(--ink)]">{m.title}</div>
                      <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--ink-faint)]">
                        {m.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky top-4 h-fit rounded-2xl border border-[var(--border)] bg-card p-5">
          <h4 className="mb-4 text-[15px] font-bold text-[var(--ink)]">Order Summary</h4>
          <div className="scrollbar-none mb-4 flex max-h-[240px] flex-col gap-3 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <BookCover
                  cover={item.cover || undefined}
                  tint={tintForId(item.id)}
                  alt={item.title}
                  className="h-[56px] w-[40px] shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{item.title}</div>
                  <div className="text-[11px] text-[var(--ink-faint)]">Qty {item.qty}</div>
                </div>
                <span className="shrink-0 text-[12.5px] font-bold text-[var(--ink)]">
                  {item.price != null ? money(item.price * item.qty) : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="h-px bg-[var(--border)]" />
          <div className="mt-4 flex items-center justify-between text-[13.5px] text-[var(--ink-dim)]">
            <span>Subtotal</span>
            <span className="text-[var(--ink)]">{money(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[13.5px] text-[var(--ink-dim)]">
            <span>Delivery {deliveryCity ? `(${deliveryCity})` : ""}</span>
            <span className="text-[var(--ink)]">
              {deliveryCity ? money(deliveryFee) : "Select city"}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-faint)]">
            Based on {(totalWeight / 1000).toFixed(2)} kg total weight
          </div>
          <div className="my-4 h-px bg-[var(--border)]" />
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[var(--ink)]">Total</span>
            <span className="text-[20px] font-extrabold text-[var(--ink)]">{money(total)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="btn-accent mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[13.5px] font-bold text-white disabled:opacity-60"
          >
            {placing ? "Placing Order…" : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
