import type { ButtonHTMLAttributes } from "react";

// Icon-only button: the label is required so every icon button has an accessible name.
export default function IconButton({
  label,
  className = "",
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--ink-dim)] transition-colors hover:bg-[var(--surface-tint-strong)] hover:text-[var(--ink)] disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
