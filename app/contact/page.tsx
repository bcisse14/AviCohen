import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/ContactForm";
import { StructuredData } from "@/components/StructuredData";
import { Eyebrow } from "@/components/ui";
import {
  IconClock,
  IconMail,
  IconPhone,
  IconPin,
} from "@/components/icons";
import { siteConfig, team } from "@/lib/site-config";
import { getDentistStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez le cabinet du Dr Avi Cohen à Paris 12e : coordonnées, horaires, formulaire de contact et rendez-vous en ligne via Doctolib.",
  openGraph: {
    title: `Contact - ${siteConfig.practiceName}`,
    description:
      "Coordonnées, horaires, formulaire de contact et rendez-vous en ligne via Doctolib.",
  },
};

export default function ContactPage() {
  const mapQuery = `${siteConfig.address.streetAddress}, ${siteConfig.address.postalCode} ${siteConfig.address.addressLocality}, ${siteConfig.address.addressCountry}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;

  return (
    <>
      <StructuredData data={getDentistStructuredData()} />

      <PageHero
        eyebrow="Contact"
        title="Contactez le cabinet"
        description="Une question, une demande de rendez-vous ? Le secrétariat vous répond, ou réservez directement un créneau en ligne via Doctolib."
      />

      <section>
        <div className="container-site grid gap-12 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>Coordonnées</Eyebrow>
            <ul className="mt-6 flex flex-col gap-5">
              <li className="flex items-start gap-3">
                <IconPin className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                <span className="text-muted">
                  {siteConfig.address.streetAddress}
                  <br />
                  {siteConfig.address.postalCode}{" "}
                  {siteConfig.address.addressLocality}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <IconPhone className="h-6 w-6 shrink-0 text-accent" />
                <a
                  href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                  className="text-ink no-underline hover:text-accent"
                >
                  {siteConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <IconMail className="h-6 w-6 shrink-0 text-accent" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-ink no-underline hover:text-accent"
                >
                  {siteConfig.email}
                </a>
              </li>
            </ul>

            <p className="eyebrow mt-10">Horaires</p>
            <ul className="mt-4 flex flex-col gap-2">
              {siteConfig.openingHours.map((slot) => (
                <li
                  key={slot.days}
                  className="flex items-center gap-3 text-muted"
                >
                  <IconClock className="h-5 w-5 shrink-0 text-accent" />
                  <span>
                    {slot.days} : {slot.hours}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-xl text-ink">Rendez-vous en ligne</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Consultez les disponibilités du cabinet et réservez votre
                créneau directement sur Doctolib, auprès du dentiste de
                votre choix.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {team.map((member) => (
                  <a
                    key={member.slug}
                    href={member.doctolibUrl}
                    className="btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rendez-vous avec le {member.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-7 sm:p-8">
              <h2 className="text-xl text-ink">Plan d&apos;accès</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                La carte démarre directement sur l&apos;adresse du cabinet pour
                vous aider à vous repérer facilement.
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                <iframe
                  title="Carte Google Maps du cabinet"
                  src={mapSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[320px] w-full sm:h-[400px]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-7 sm:p-8">
              <h2 className="text-xl text-ink">Envoyer un message</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pour toute urgence, privilégiez un appel téléphonique
                directement au cabinet.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
