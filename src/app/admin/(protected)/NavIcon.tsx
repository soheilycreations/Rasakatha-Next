const PATHS: Record<string, React.ReactNode> = {
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  till: (
    <>
      <rect x="2.5" y="9" width="19" height="12" rx="2" />
      <path d="M6 9V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      <path d="M2.5 14h19" />
      <circle cx="12" cy="17" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 2h12v19l-2.5-1.5L13 21l-1-1.5L11 21l-2.5-1.5L6 21z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M12 20V4M20 20v-7" />
      <path d="M2 20h20" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 12.9 11.1 3.4a2 2 0 0 0-1.4-.6H4a1 1 0 0 0-1 1v5.7c0 .5.2 1 .6 1.4l9.5 9.5a2 2 0 0 0 2.8 0l4.7-4.7a2 2 0 0 0 0-2.8z" />
      <circle cx="7.5" cy="7.5" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />,
  log: (
    <>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 10h8M8 14h8M8 18h5" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
};

export default function NavIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
