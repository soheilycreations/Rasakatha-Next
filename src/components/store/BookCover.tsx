import Image from "next/image";
import BookTint from "./BookTint";

export default function BookCover({
  cover,
  tint,
  alt,
  caption,
  className = "",
  imgClassName = "",
  children,
}: {
  cover?: string;
  tint: string;
  alt: string;
  caption?: string;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}) {
  if (cover) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={cover}
          alt={alt}
          fill
          sizes="(max-width: 640px) 45vw, 200px"
          className={`object-cover ${imgClassName}`}
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
