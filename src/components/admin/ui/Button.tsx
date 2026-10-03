import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-accent text-white",
  secondary: "border border-[var(--border-strong)] bg-[var(--surface-tint)] text-[var(--ink)] hover:border-accent hover:text-accent",
  ghost: "text-[var(--ink-dim)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]",
  danger: "border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20",
};
// md = 44px touch target; sm is for dense desktop tables only.
const SIZES: Record<Size, string> = { md: "min-h-11 px-5 text-[13.5px]", sm: "min-h-9 px-3.5 text-[12.5px]" };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export default function Button({ variant = "secondary", size = "md", loading, disabled, className = "", children, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}
