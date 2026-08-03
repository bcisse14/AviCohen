import Link from "next/link";
import { navigation, siteConfig } from "@/lib/site-config";
import { IconClock, IconMail, IconPhone, IconPin } from "@/components/icons";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-lg text-ink">{siteConfig.name}</p>
          <p className="mt-2 text-sm text-muted">{siteConfig.tagline}</p>
          <p className="mt-4 text-sm text-muted">{siteConfig.description}</p>
        </div>

        <nav aria-label="Plan du site">
          <p className="eyebrow">Navigation</p>
          <ul className="mt-4 flex flex-col gap-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted no-underline hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="eyebrow">Coordonnées</p>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-muted">
            <li className="flex items-start gap-2">
              <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span>
                {siteConfig.address.streetAddress}
                <br />
                {siteConfig.address.postalCode} {siteConfig.address.addressLocality}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <IconPhone className="h-5 w-5 shrink-0 text-accent" />
              <a
                href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                className="no-underline hover:text-accent"
              >
                {siteConfig.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <IconMail className="h-5 w-5 shrink-0 text-accent" />
              <a href={`mailto:${siteConfig.email}`} className="no-underline hover:text-accent">
                {siteConfig.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Horaires</p>
          <ul className="mt-4 flex flex-col gap-2 text-sm text-muted">
            {siteConfig.openingHours.map((slot) => (
              <li key={slot.days} className="flex items-start gap-2">
                <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <span>
                  {slot.days} : {slot.hours}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-6">
        <div className="container-site flex flex-col gap-2 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.practiceName}. Tous droits
            réservés.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/mentions-legales" className="no-underline hover:text-accent">
              Mentions légales
            </Link>
            <a
              href="https://bafode-cisse.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline hover:text-accent"
            >
              Site réalisé par Karlsefni
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
