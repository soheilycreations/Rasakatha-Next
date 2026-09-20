import { ORDER_STATUS_STEPS, type OrderStatus } from "@/lib/orders";

export default function OrderStatusTracker({ status }: { status: OrderStatus }) {
  const activeIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center">
      {ORDER_STATUS_STEPS.map((step, i) => {
        const done = i <= activeIndex;
        const isLast = i === ORDER_STATUS_STEPS.length - 1;
        return (
          <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                  done ? "bg-accent text-white" : "bg-[var(--surface-tint-strong)] text-[var(--ink-faint)]"
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`whitespace-nowrap text-[10.5px] font-semibold ${
                  done ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`mx-1.5 h-[2px] flex-1 rounded-full transition-colors ${i < activeIndex ? "bg-accent" : "bg-[var(--border)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
