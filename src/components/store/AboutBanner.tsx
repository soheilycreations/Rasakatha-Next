import { IconBook, IconCategories, IconTruck } from "./icons";

const STATS = [
  { icon: IconBook, value: "1,500+", label: "Books curated" },
  { icon: IconCategories, value: "20+", label: "Genres to explore" },
  { icon: IconTruck, value: "Island-wide", label: "Doorstep delivery" },
];

export default function AboutBanner() {
  return (
    <section className="mb-10 px-6 sm:px-8">
      <div
        className="relative overflow-hidden rounded-[24px] border border-[var(--border)] px-6 py-10 shadow-[0_22px_50px_-24px_rgba(0,0,0,0.45)] sm:px-12 sm:py-14"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, rgba(239,66,56,0.16) 0%, rgba(239,66,56,0) 55%), radial-gradient(100% 120% at 100% 100%, rgba(0,174,240,0.13) 0%, rgba(0,174,240,0) 55%), var(--card)",
        }}
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-accent/[0.08] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-accent-blue/[0.08] blur-3xl" />
        <div
          className="pointer-events-none absolute -right-6 bottom-0 select-none font-display text-[220px] font-black leading-none text-[var(--ink)] opacity-[0.03] sm:text-[280px]"
          aria-hidden
        >
          &rdquo;
        </div>

        <div className="relative grid gap-10 sm:grid-cols-[1.2fr_1fr] sm:items-center sm:gap-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-[2px] w-6 rounded-full bg-accent" />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Our Story</span>
            </div>
            <h3 className="font-display mt-3 text-[26px] font-bold leading-[1.15] text-[var(--ink)] sm:text-[32px]">
              Sri Lanka&apos;s home for stories worth telling
            </h3>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[var(--ink-dim)]">
              From timeless Sinhala classics to bold new voices, Rasakatha Publishers curates every
              title with care — bringing great reading to doorsteps across the island since day one.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-tint)] px-4 py-3.5 backdrop-blur-sm transition-colors hover:border-accent/30 hover:bg-[var(--surface-tint-strong)]"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/[0.12] text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg font-extrabold leading-tight text-[var(--ink)]">
                    {value}
                  </div>
                  <div className="truncate text-[11.5px] text-[var(--ink-faint)]">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
