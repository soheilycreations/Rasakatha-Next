import { IconStar } from "./icons";

export default function StarRating({
  rating,
  size = 11,
}: {
  rating: number;
  size?: number;
}) {
  const filled = Math.round(rating);

  return (
    <div className="mt-1 flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar
          key={i}
          style={{
            width: size,
            height: size,
            fill: i < filled ? "#f5b301" : "none",
            color: i < filled ? "#f5b301" : "var(--ink-faint)",
          }}
        />
      ))}
    </div>
  );
}
