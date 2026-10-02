import Footer from "./Footer";

export default function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-4">
      <article className="mx-auto max-w-3xl px-4 pb-10 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="h-[2px] w-6 rounded-full bg-accent" />
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{eyebrow}</span>
        </div>
        <h1 className="font-display mt-3 text-[28px] font-bold leading-tight text-[var(--ink)] sm:text-[34px]">{title}</h1>
        {intro && <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-dim)]">{intro}</p>}
        <div className="info-prose mt-8 space-y-8 text-[14.5px] leading-relaxed text-[var(--ink-dim)]">{children}</div>
      </article>
      <Footer />
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-2.5 text-lg font-bold text-[var(--ink)]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
