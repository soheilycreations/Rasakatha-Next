export default function BookTint({
  tint,
  caption,
  className = "",
  children,
}: {
  tint: string;
  caption?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`diagonal-tint relative overflow-hidden ${className}`} style={{ background: tint }}>
      {caption && (
        <div className="absolute inset-0 flex items-center justify-center px-2 text-center font-mono text-[10px] tracking-[0.12em] text-white/60">
          {caption}
        </div>
      )}
      {children}
    </div>
  );
}
