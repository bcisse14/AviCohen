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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] max-w-[95vw] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer l'image"
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-xl text-white transition hover:bg-black"
            >
              ×
            </button>

            <div className="overflow-hidden rounded-[1.5rem] border border-white/20 bg-surface/80 p-2 shadow-2xl">
              <Image
                src={src}
                alt={alt}
                width={1600}
                height={1200}
                priority
                className="max-h-[84vh] max-w-[90vw] rounded-[1rem] object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
