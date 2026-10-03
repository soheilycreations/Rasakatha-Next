import Image from "next/image";
import BookTint from "./BookTint";

export default function BookCover({
  cover,
  tint,
  alt,
  caption,
  className = "",
  imgClassName = "",
  priority = false,
  sizes = "(max-width: 640px) 45vw, 200px",
  children,
}: {
  cover?: string;
  tint: string;
  alt: string;
  caption?: string;
  className?: string;
  imgClassName?: string;
  // set for the likely LCP image so it's preloaded instead of lazy-loaded
  priority?: boolean;
  // the rendered width of the image, so next/image picks a right-sized file
  sizes?: string;
  children?: React.ReactNode;
}) {
  if (cover) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={cover}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover ${imgClassName}`}
          // Optimised covers (.webp, <=900px: scripts/optimize-covers.ts and the admin upload) go
          // through next/image for responsive sizes. Older covers are still raw 5-8MB scans that
          // can 500 in the on-the-fly optimizer, so those are served as-is until they're converted.
          unoptimized={cover.startsWith("http") && !cover.split("?")[0].toLowerCase().endsWith(".webp")}
        />
        {children}
      </div>
    );
  }
  return (
    <BookTint tint={tint} caption={caption} className={className}>
      {children}
    </BookTint>
  );
}
