import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Fields always have a VISIBLE label: a placeholder is never used as the label.
export const fieldClass =
  "w-full min-h-11 rounded-xl border bg-[var(--surface-tint)] px-3.5 py-2.5 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] transition-colors focus:outline-none disabled:opacity-60";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12.5px] font-semibold text-[var(--ink-dim)]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} role="alert" className="text-[12px] text-accent">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-[12px] text-[var(--ink-faint)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type Common = { label: string; hint?: string; error?: string };

export function Input({ label, hint, error, className = "", id, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} hint={hint} error={error}>
      <input
        id={fid}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${fid}-msg` : undefined}
        className={`${fieldClass} ${error ? "border-accent" : "border-[var(--border)]"} ${className}`}
        {...rest}
      />
    </Field>
  );
}

export function Textarea({ label, hint, error, className = "", id, rows = 4, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} hint={hint} error={error}>
      <textarea
        id={fid}
        rows={rows}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${fid}-msg` : undefined}
        className={`${fieldClass} resize-y ${error ? "border-accent" : "border-[var(--border)]"} ${className}`}
        {...rest}
      />
    </Field>
  );
}

export function Select({ label, hint, error, className = "", id, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} hint={hint} error={error}>
      <select id={fid} aria-invalid={!!error || undefined} className={`${fieldClass} ${error ? "border-accent" : "border-[var(--border)]"} ${className}`} {...rest}>
        {children}
      </select>
    </Field>
  );
}

export default Input;
