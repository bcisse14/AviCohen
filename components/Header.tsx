"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { navigation, siteConfig } from "@/lib/site-config";
import { IconClose, IconMenu } from "@/components/icons";

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const menuId = useId();

  // Ferme le menu mobile à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Ferme le menu mobile avec la touche Echap (navigation clavier).
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-site flex h-20 items-center justify-between gap-3">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap font-serif text-lg font-medium text-ink no-underline"
        >
          {siteConfig.name}
        </Link>

        <nav aria-label="Navigation principale" className="hidden min-w-0 lg:block">
          <ul className="flex items-center gap-5 xl:gap-7">
            {navigation.map((item) => (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className="whitespace-nowrap text-sm font-medium text-ink no-underline transition-colors hover:text-accent"
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <ul className="invisible absolute left-0 top-full z-10 min-w-[220px] rounded-lg border border-border bg-surface p-2 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
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

        <div className="hidden shrink-0 lg:block">
          <Link
            href={siteConfig.doctolibUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary whitespace-nowrap !px-5 !py-2.5 text-sm"
          >
            Prendre rendez-vous
          </Link>
        </div>

        <button
          type="button"
          className="btn-secondary shrink-0 !px-3 !py-2 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
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
        className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background lg:hidden"
      >
        <nav aria-label="Navigation principale (mobile)">
          <ul className="container-site flex flex-col gap-1 py-4">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-2 py-3 text-base font-medium text-ink no-underline hover:text-accent"
                >
                  {item.label}
                </Link>
                {item.children ? (
                  <ul className="ml-4 flex flex-col gap-1 border-l border-border pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-2 py-2 text-sm text-muted no-underline hover:text-accent"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
            <li className="mt-2">
              <Link
                href={siteConfig.doctolibUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full"
              >
                Prendre rendez-vous
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
