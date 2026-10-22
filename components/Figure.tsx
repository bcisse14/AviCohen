"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image, { type StaticImageData } from "next/image";

export function Figure({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  fit = "cover",
  position = "center",
  natural = false,
}: {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fit?: "cover" | "contain";
  position?: "center" | "top" | "bottom" | "left" | "right";
  natural?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const imageHref = typeof src === "string" ? src : src.src;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`${alt} - ouvrir l'image en grand`}
        aria-haspopup="dialog"
        className="group block w-full text-left no-underline"
      >
        <div
          className={`relative overflow-hidden rounded-2xl border border-border bg-surface ${className}`}
        >
          <Image
            src={src}
            alt={alt}
            fill={!natural}
            width={natural ? 1600 : undefined}
            height={natural ? 1000 : undefined}
            unoptimized={typeof src === "string" && src.startsWith("https://")}
            priority={priority}
            sizes={sizes}
            style={{ objectFit: fit, objectPosition: position, ...(natural ? { width: "100%", height: "auto" } : {}) }}
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </button>

      <dialog ref={dialogRef} aria-modal="true" aria-labelledby={titleId}
        onCancel={() => setIsOpen(false)}
        onClose={() => { setIsOpen(false); triggerRef.current?.focus({ preventScroll: true }); }}
        onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}
        className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-black/90 p-4 text-white backdrop:bg-black/70">
        <h2 id={titleId} className="sr-only">{alt}</h2>
        <div className="flex h-full flex-col gap-4">
          <button type="button" onClick={() => setIsOpen(false)}
            className="min-h-11 shrink-0 self-end rounded-lg border border-white/50 bg-black px-4 py-2 text-sm text-white hover:bg-white/20">
            <span aria-hidden="true" className="mr-2">×</span>Fermer l’image
          </button>
          <div className="flex min-h-0 flex-1 items-center justify-center"
            onClick={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
            {isOpen && (
              // The original is displayed without cropping in the accessible modal.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageHref} alt={alt} className="block max-h-full max-w-full object-contain" />
            )}
          </div>
          <p className="shrink-0 text-center text-xs text-white/80">Échap, le bouton Fermer ou un clic autour de l’image pour revenir à la page.</p>
        </div>
      </dialog>
    </>
  );
}
