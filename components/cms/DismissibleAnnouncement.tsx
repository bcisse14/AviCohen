"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { IconClose } from "@/components/icons";

const dismissed = new Set<string>();
const listeners = new Set<() => void>();
const queue = new Map<string, string>();
function notify() { listeners.forEach((listener) => listener()); }
function activeAnnouncement() {
  for (const [id, key] of queue) if (!isDismissed(key)) return id;
  return "";
}
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

export function DismissibleAnnouncement({ storageKey, title, children, widthClass = "max-w-content" }: {
  storageKey: string; title: string; children: ReactNode; widthClass?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();
  const titleId = `${id}-title`;
  const active = useSyncExternalStore(subscribe, activeAnnouncement, () => "") === id;
  useEffect(() => {
    queue.set(id, storageKey);
    notify();
    return () => { queue.delete(id); notify(); };
  }, [id, storageKey]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [active]);
  function dismiss() {
    dismissed.add(storageKey);
    try { sessionStorage.setItem(storageKey, "closed"); }
    catch (error) { reportStorageError(error); }
    notify();
  }
  return <dialog ref={dialogRef} aria-modal="true" aria-labelledby={titleId}
    onKeyDown={(event) => {
      if (event.key !== "Escape" || event.defaultPrevented ||
        !(event.target instanceof Element) || event.target.closest("dialog") !== event.currentTarget) return;
      event.preventDefault(); event.stopPropagation(); dismiss();
    }}
    onCancel={(event) => {
      if (event.target !== event.currentTarget) return;
      event.preventDefault(); event.stopPropagation(); dismiss();
    }}
    onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}
    className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-transparent p-3 text-ink backdrop:bg-black/75 sm:p-6">
    <div className="flex min-h-full items-center justify-center"
      onClick={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <div className={`flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:max-h-[calc(100dvh-3rem)] ${widthClass}`}>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 py-3">
          <h2 id={titleId} className="min-w-0 break-words text-lg">{title}</h2>
          <button type="button" onClick={dismiss}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-ink hover:border-accent hover:text-accent"
            aria-label={`Fermer l’annonce : ${title}`}>
            <IconClose className="h-5 w-5 shrink-0" /><span>Fermer</span>
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  </dialog>;
}
