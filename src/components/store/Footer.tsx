import Image from "next/image";
import logoLight from "@/assets/rasakatha-logo-light-mode.png";
import logoDark from "@/assets/rasakatha-logo-dark-mode.png";

const COLUMNS = [
  { title: "Shop", links: ["New Arrivals", "Best Sellers", "Sale & Offers"] },
  { title: "Rasakatha", links: ["About Us", "Publishers", "Contact"] },
  { title: "Support", links: ["Delivery & Returns", "Order Tracking", "Help Center"] },
];

export default function Footer({ onTrackOrder }: { onTrackOrder: () => void }) {
  return (
    <footer className="mt-4 border-t border-[var(--border)] bg-[var(--card-2)] px-6 py-12 sm:px-8">
      <div className="flex flex-col gap-10 sm:flex-row sm:justify-between sm:gap-8">
        <div className="max-w-sm">
          <div className="flex items-center">
            <Image src={logoLight} alt="Rasakatha.lk" className="logo-light h-[38px] w-auto" />
            <Image src={logoDark} alt="Rasakatha.lk" className="logo-dark h-[38px] w-auto" />
          </div>
          <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--ink-dim)]">
            Sri Lanka&apos;s home for Sinhala and English books — new releases, timeless classics,
            and everything in between, delivered island-wide.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-14">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[12.5px] font-bold uppercase tracking-wide text-[var(--ink)]">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-[14px] text-[var(--ink-dim)]">
                {col.links.map((link) =>
                  link === "Order Tracking" ? (
                    <li key={link}>
                      <button
                        onClick={onTrackOrder}
                        className="cursor-pointer text-left transition-colors hover:text-accent"
                      >
                        {link}
                      </button>
                    </li>
                  ) : (
                    <li key={link} className="cursor-pointer transition-colors hover:text-accent">
                      {link}
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[var(--border)] pt-6 text-[13px] text-[var(--ink-faint)] sm:flex-row sm:items-center">
        <span>© {new Date().getFullYear()} Rasakatha Publishers. All rights reserved.</span>
        <div className="flex items-center gap-2.5">
          {["f", "in", "ig"].map((s) => (
            <span
              key={s}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-tint)] text-[12px] font-bold text-[var(--ink-dim)] transition-colors hover:border-accent/40 hover:text-accent"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
