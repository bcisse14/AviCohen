"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Settings } from "@/lib/cms/schema";
import { IconClose, IconMenu } from "@/components/icons";

export function Header({ settings }: { settings: Pick<Settings, "navigation" | "team" | "name"> }) {
  const { navigation, team } = settings;
  const desktopMenu = navigation.length <= 6;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const bookingRef = useRef<HTMLDetailsElement>(null);
  const bookingSummary = useRef<HTMLElement>(null);

  function closeBooking(restoreFocus = false) {
    if (!bookingRef.current?.open) return;
    bookingRef.current.open = false;
    if (restoreFocus) bookingSummary.current?.focus();
  }

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => {
    setOpen(false);
    closeBooking();
  }, [pathname]);

  // Ferme le menu mobile avec la touche Echap (navigation clavier).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
      if (open) {
        setOpen(false);
        menuButton.current?.focus();
      }
      closeBooking(true);
    }
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (!bookingRef.current?.contains(event.target)) closeBooking();
      if (open && !headerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-site flex h-20 items-center justify-between gap-3">
        <Link
          href="/"
          title={settings.name}
          className="min-w-0 truncate font-serif text-lg font-medium text-ink no-underline lg:max-w-[220px]"
        >
          {settings.name}
        </Link>

        <nav aria-label="Navigation principale" className={`hidden min-w-0 ${desktopMenu ? "lg:block" : ""}`}>
          <ul className="flex items-center gap-5 xl:gap-7">
            {navigation.map((item) => (
              <li key={item.href} className="group relative min-w-0">
                <Link
                  href={item.href}
                  title={item.label}
                  className="block truncate text-sm font-medium text-ink no-underline transition-colors hover:text-accent"
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
                {item.children.length > 0 ? (
                  <ul className="invisible absolute left-0 top-full z-10 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-border bg-surface p-2 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-3 py-2 text-sm text-ink no-underline hover:bg-surface-elevated hover:text-accent"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        {team.length > 0 && <div className="relative hidden shrink-0 lg:block">
          <details ref={bookingRef} className="group">
            <summary ref={bookingSummary} className="btn-primary cursor-pointer whitespace-nowrap !px-5 !py-2.5 text-sm marker:content-none">
              Prendre rendez-vous
            </summary>
            <div className="absolute right-0 top-full z-20 mt-3 w-72 rounded-xl border border-border bg-surface p-3 shadow-xl">
              <p className="px-2 pb-2 text-sm text-muted">Avec quel praticien ?</p>
              <ul className="flex flex-col gap-2">
                {team.map((member) => (
                  <li key={member.id}>
                    <Link
                      href={member.doctolibUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-border px-3 py-2 text-sm text-ink no-underline transition-colors hover:border-accent hover:text-accent"
                      onClick={() => closeBooking(true)}
                    >
                      {member.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" className="cms-action mt-3 min-h-11 w-full" onClick={() => closeBooking(true)}>Fermer les rendez-vous</button>
            </div>
          </details>
        </div>}

        <button
          ref={menuButton}
          type="button"
          className={`btn-secondary shrink-0 !px-3 !py-2 ${desktopMenu ? "lg:hidden" : ""}`}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => { closeBooking(); setOpen((v) => !v); }}
        >
          {open ? <IconClose /> : <IconMenu />}
          <span className="sr-only">
            {open ? "Fermer le menu" : "Ouvrir le menu"}
          </span>
        </button>
      </div>

      <div
        id={menuId}
        hidden={!open}
        className={`max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background ${desktopMenu ? "lg:hidden" : ""}`}
      >
        <nav aria-label="Navigation principale (mobile)">
          <ul className="container-site flex flex-col gap-1 py-4">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-2 py-3 text-base font-medium text-ink no-underline hover:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children.length > 0 ? (
                  <ul className="ml-4 flex flex-col gap-1 border-l border-border pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-2 py-2 text-sm text-muted no-underline hover:text-accent"
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            {team.length > 0 && <li className="mt-2 rounded-xl border border-border bg-surface p-3">
              <p className="text-base font-medium text-ink">Prendre rendez-vous</p>
              <p className="mt-1 text-sm text-muted">Choisissez votre praticien</p>
              <ul className="mt-3 flex flex-col gap-2">
                {team.map((member) => (
                  <li key={member.id}>
                    <Link
                      href={member.doctolibUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full"
                      onClick={() => setOpen(false)}
                    >
                      {member.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>}
            <li className="mt-3">
              <button type="button" className="cms-action min-h-11 w-full" onClick={() => {
                setOpen(false);
                menuButton.current?.focus();
              }}>Fermer le menu</button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
