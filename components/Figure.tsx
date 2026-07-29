"use client";

import { useEffect, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`${alt} - ouvrir l'image en grand`}
        className="group block w-full text-left no-underline"
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
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 py-6"
          onClick={() => setIsOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fermer l'image"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-3xl leading-none text-white/90 transition hover:text-white"
          >
            ×
          </button>

          <div className="relative flex max-h-[90vh] max-w-[95vw] items-center justify-center">
            <button
              type="button"
              onClick={(event) => event.stopPropagation()}
              aria-label="Image agrandie"
              className="block cursor-default"
            >
              <Image
                src={src}
                alt={alt}
                width={1600}
                height={1200}
                priority
                className="max-h-[90vh] max-w-[92vw] object-contain"
              />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
