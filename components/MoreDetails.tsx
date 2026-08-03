"use client";

import { useEffect, useId, useRef, useState } from "react";

type DetailItem = {
  title: string;
  paragraphs: string[];
};

export function MoreDetails({
  heading,
  items,
}: {
  heading: string;
  items: DetailItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const sectionId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isOpen) {
      headingRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className="mt-8 rounded-2xl border border-border bg-background p-5 sm:p-7">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={sectionId}
        onClick={() => setIsOpen((current) => !current)}
        className="btn-secondary w-full justify-between text-left"
      >
        <span>{isOpen ? "Moins de détails" : "Plus de détails"}</span>
        <span aria-hidden="true" className="text-lg leading-none">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isOpen ? "Le contenu détaillé est affiché." : "Le contenu détaillé est masqué."}
      </p>

      <div
        id={sectionId}
        className={isOpen ? "mt-6" : "hidden"}
        role="region"
        aria-label={heading}
      >
        <h3 ref={headingRef} tabIndex={-1} className="text-2xl sm:text-3xl">
          {heading}
        </h3>
        <div className="mt-5 space-y-6">
          {items.map((item) => (
            <section key={item.title} className="space-y-3">
              <h4 className="text-lg text-ink">{item.title}</h4>
              {item.paragraphs.map((paragraph) => (
                <p key={paragraph} className="leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}