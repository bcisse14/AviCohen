/**
 * Icônes vectorielles génériques dessinées à la main (trait simple,
 * `currentColor`), utilisées notamment sur les pages Implantologie et
 * Esthétique dentaire en l'absence de photographies pour ces
 * spécialités. Elles héritent de la couleur du texte qui les entoure
 * (ex: `text-accent`).
 */
type IconProps = { className?: string };

export function IconTooth({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 6c-4.5 0-6 3-9 3-4.5 0-7 3.5-7 8.5 0 6 2.5 8.5 3.5 14 .8 4.3 2 8.5 4.5 8.5 3 0 3-9 8-9s5 9 8 9c2.5 0 3.7-4.2 4.5-8.5 1-5.5 3.5-8 3.5-14 0-5-2.5-8.5-7-8.5-3 0-4.5-3-9-3Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconImplant({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M17 6h14l-2 8H19l-2-8Z" strokeLinejoin="round" />
      <path d="M20 14h8v6h-8z" strokeLinejoin="round" />
      <path d="M21 20h6v20l-3 4-3-4V20Z" strokeLinejoin="round" />
      <path d="M22 24h4M21 28h6M21.5 32h5M22 36h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconSparkleSmile({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 20c3 8 8.5 12 14 12s11-4 14-12"
        strokeLinecap="round"
      />
      <path d="M14 20a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" fill="currentColor" stroke="none" />
      <path d="M30 20a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" fill="currentColor" stroke="none" />
      <path
        d="M37 8l1.4 3.6L42 13l-3.6 1.4L37 18l-1.4-3.6L32 13l3.6-1.4L37 8Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconShield({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 6l14 5v11c0 9-6 15.5-14 20-8-4.5-14-11-14-20V11l14-5Z"
        strokeLinejoin="round"
      />
      <path d="M18 24l4.5 4.5L31 19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClock({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPin({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function IconPhone({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2C11 21 3 13 3 6a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMail({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCalendar({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

export function IconDocument({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 12h6M9 16h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={className}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenu({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconClose({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconImageOff({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m7 15 3.5-3.5a1.5 1.5 0 0 1 2 0L15 14l1-1a1.5 1.5 0 0 1 2 0l1 1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8.5" cy="9.5" r="1.25" fill="currentColor" stroke="none" />
      <path d="M3 3l18 18" strokeLinecap="round" />
    </svg>
  );
}
