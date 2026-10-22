"use client";

import { useRef, useSyncExternalStore, type ReactNode } from "react";
import { IconClose } from "@/components/icons";

const dismissed = new Set<string>();
const listeners = new Set<() => void>();
let storageWarningShown = false;
function reportStorageError(error: unknown) {
  if (storageWarningShown) return;
  storageWarningShown = true;
  console.warn("Annonces : stockage de session indisponible. Les fermetures restent mémorisées tant que le site reste ouvert.", error);
}
function isDismissed(key: string) {
  if (dismissed.has(key)) return true;
  try {
    return sessionStorage.getItem(key) === "closed";
  } catch (error) {
    reportStorageError(error);
    return false;
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function nextContent(root: HTMLElement) {
  const candidates = document.querySelectorAll<HTMLElement>("h1, h2, a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]");
  return Array.from(candidates).find((element) =>
    !root.contains(element) && Boolean(root.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) &&
    !element.closest("[hidden], [inert]") && element.getClientRects().length > 0,
  );
}

export function DismissibleAnnouncement({ storageKey, title, children }: {
  storageKey: string; title: string; children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const closed = useSyncExternalStore(subscribe, () => isDismissed(storageKey), () => false);
  function dismiss() {
    const next = root.current ? nextContent(root.current) : undefined;
    dismissed.add(storageKey);
    try { sessionStorage.setItem(storageKey, "closed"); }
    catch (error) { reportStorageError(error); }
    listeners.forEach((listener) => listener());
    requestAnimationFrame(() => {
      if (!next?.isConnected) return;
      if (!next.hasAttribute("tabindex") && next.matches("h1, h2")) {
        next.setAttribute("tabindex", "-1");
        next.addEventListener("blur", () => next.removeAttribute("tabindex"), { once: true });
      }
      next.focus({ preventScroll: true });
    });
  }
  if (closed) return null;
  const closeButton = <button type="button" onClick={dismiss}
    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm text-ink hover:border-accent hover:text-accent"
    aria-label={`Fermer l’annonce : ${title}`}>
    <IconClose className="h-5 w-5 shrink-0" /><span>Fermer l’annonce</span>
  </button>;
  return <div ref={root} role="region" aria-label={`Annonce : ${title}`} onKeyDown={(event) => {
    if (event.key !== "Escape" || event.defaultPrevented ||
      (event.target instanceof Element && event.target.closest("dialog"))) return;
    event.preventDefault();
    event.stopPropagation();
    dismiss();
  }}>
    <div className="flex justify-end px-5 pt-4 sm:px-6 lg:px-8">{closeButton}</div>
    {children}
    <div className="flex justify-end border-b border-border px-5 pb-4 sm:px-6 lg:px-8">{closeButton}</div>
  </div>;
}
