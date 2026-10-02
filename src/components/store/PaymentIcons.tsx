// Neutral inline icons for payment methods (no brand logos are bundled; swap in
// official PayHere / Koko / MintPay artwork once merchant accounts are approved).
const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function PaymentIcon({ id, className = "h-6 w-6" }: { id: string; className?: string }) {
  switch (id) {
    case "cod":
      return (
        <svg {...common} className={className} aria-hidden="true">
          <rect x="2.5" y="6" width="19" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.6" />
          <path d="M6 9.5v.01M18 14.5v.01" />
        </svg>
      );
    case "payhere":
      return (
        <svg {...common} className={className} aria-hidden="true">
          <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
          <path d="M2.5 10h19M6.5 15h4" />
        </svg>
      );
    case "koko":
      return (
        <svg {...common} className={className} aria-hidden="true">
          <circle cx="6" cy="12" r="3" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="18" cy="12" r="3" />
        </svg>
      );
    default:
      return (
        <svg {...common} className={className} aria-hidden="true">
          <path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14z" />
          <path d="M5 19c3-5 6-8 10-10" />
        </svg>
      );
  }
}
