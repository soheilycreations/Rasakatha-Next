"use client";

export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[var(--ink)] px-4 py-2 text-[13px] font-semibold text-[var(--bg)] shadow-lg">
      {message}
    </div>
  );
}
