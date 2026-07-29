import Image, { type StaticImageData } from "next/image";

export function Figure({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const imageHref = typeof src === "string" ? src : src.src;

  return (
    <a
      href={imageHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${alt} - ouvrir l'image en grand`}
      className="group block no-underline"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-border bg-surface ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
    </a>
  );
}
