import type { CoverTheme } from "@/lib/data";

function Motif({ motif, ink, id }: { motif: CoverTheme["motif"]; ink: string; id: string }) {
  switch (motif) {
    case "moon":
      return (
        <>
          <circle cx="72%" cy="26%" r="15%" fill={ink} opacity="0.9" />
          <circle cx="66%" cy="22%" r="15%" fill={`url(#${id}-bg)`} />
        </>
      );
    case "flame":
      return (
        <path
          d="M50 20 C35 40 30 55 45 68 C40 55 48 50 50 44 C55 55 65 58 58 72 C75 62 72 42 50 20 Z"
          fill={ink}
          opacity="0.85"
          transform="translate(0 5) scale(1.15)"
        />
      );
    case "rain":
      return (
        <g stroke={ink} strokeWidth="2.5" strokeLinecap="round" opacity="0.75">
          <line x1="25" y1="15" x2="18" y2="35" />
          <line x1="45" y1="10" x2="38" y2="32" />
          <line x1="65" y1="18" x2="58" y2="40" />
          <line x1="82" y1="30" x2="75" y2="50" />
          <line x1="35" y1="45" x2="28" y2="65" />
          <line x1="58" y1="50" x2="51" y2="70" />
        </g>
      );
    case "peacock":
      return (
        <g fill={ink} opacity="0.85">
          <circle cx="30%" cy="22%" r="6%" />
          <circle cx="50%" cy="16%" r="6%" />
          <circle cx="70%" cy="22%" r="6%" />
          <circle cx="40%" cy="34%" r="6%" />
          <circle cx="60%" cy="34%" r="6%" />
        </g>
      );
    case "leaf":
      return (
        <path
          d="M30 70 C30 40 55 15 85 15 C85 45 60 70 30 70 Z"
          fill={ink}
          opacity="0.8"
        />
      );
    case "wave":
    default:
      return (
        <path
          d="M0 55 C 15 45, 25 65, 40 55 S 65 45, 80 55 S 100 65, 100 55 L100 100 L0 100 Z"
          fill={ink}
          opacity="0.55"
        />
      );
  }
}

export default function CoverArt({
  cover,
  title,
  titleSi,
  className = "",
}: {
  cover: CoverTheme;
  title: string;
  titleSi?: string;
  className?: string;
}) {
  const id = title.replace(/\s+/g, "-").toLowerCase();
  return (
    <svg
      viewBox="0 0 100 140"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={cover.from} />
          <stop offset="100%" stopColor={cover.to} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="80%" cy="15%" r="60%">
          <stop offset="0%" stopColor={cover.ink} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cover.ink} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="140" fill={`url(#${id}-bg)`} />
      <rect width="100" height="140" fill={`url(#${id}-glow)`} />
      <g transform="translate(0,10) scale(0.85)" clipPath={`inset(0)`}>
        <Motif motif={cover.motif} ink={cover.ink} id={id} />
      </g>
      <rect x="6" y="6" width="88" height="128" fill="none" stroke={cover.ink} strokeOpacity="0.25" strokeWidth="0.6" />
      <text
        x="12"
        y="112"
        fontFamily="var(--font-display), serif"
        fontSize="9.5"
        fontStyle="italic"
        fill={cover.ink}
        style={{ fontWeight: 600 }}
      >
        {title.length > 14 ? title.slice(0, 13) + "…" : title}
      </text>
      {titleSi && (
        <text x="12" y="122" fontSize="5.5" fill="#f4f2ea" opacity="0.7">
          {titleSi}
        </text>
      )}
    </svg>
  );
}
