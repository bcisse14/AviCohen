import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Figure } from "@/components/Figure";
import { Eyebrow, CTALink } from "@/components/ui";
import { SpecialtyGrid } from "@/components/SpecialtyGrid";
import { StructuredData } from "@/components/StructuredData";
import {
  IconCalendar,
  IconPhone,
  IconPin,
  IconShield,
  IconSparkleSmile,
} from "@/components/icons";
import { specialties, siteConfig, team } from "@/lib/site-config";
import { getDentistStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: `${siteConfig.practiceName} - ${siteConfig.tagline}`,
  description:
    "Cabinet dentaire des Docteurs Cohen à Paris 12e : implantologie, esthétique dentaire et dentisterie numérique (CFAO), dans un cadre soigné et accueillant.",
  openGraph: {
    title: `${siteConfig.practiceName} - ${siteConfig.tagline}`,
    description:
      "Cabinet dentaire des Docteurs Cohen à Paris 12e : implantologie, esthétique dentaire et dentisterie numérique (CFAO).",
    images: ["/images/cabinet-salle-soin-01.jpg"],
  },
};

export default function AccueilPage() {
  return (
    <>
      <StructuredData data={getDentistStructuredData()} />

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-14 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Eyebrow>{siteConfig.tagline}</Eyebrow>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl">
              Un sourire soigné, dans un cabinet pensé pour vous mettre à
              l&apos;aise
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Les Docteurs Avi Cohen et Gilles Cohen accompagnent leurs
              patients à Paris 12e en implantologie, esthétique dentaire
              et dentisterie numérique, avec une attention constante
              portée au confort et à la clarté des explications.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <CTALink href="/contact">Prendre rendez-vous</CTALink>
              <CTALink href="/cabinet" variant="secondary">
                Découvrir le cabinet
              </CTALink>
            </div>
          </div>

          <Figure
            src="/images/cabinet-salle-soin-01.jpg"
            alt="Salle de soin du cabinet des Docteurs Cohen, équipée et lumineuse"
            className="aspect-[4/3] lg:aspect-[5/4]"
            priority
          />
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Le cabinet</Eyebrow>
            <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
              Un cabinet proche de la Porte Dorée
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Le cabinet des Docteurs Cohen est situé à Paris, à proximité de la
              Porte Dorée, dans un cadre facilement accessible. Il est animé
              par deux praticiens, pour un accompagnement personnalisé à
              chaque étape de votre suivi dentaire.
            </p>
          </div>

          <Figure
            src="/images/porte-doree-quartier.webp"
            alt="La Porte Dorée, à proximité du cabinet"
            className="aspect-[4/3] lg:aspect-[5/4]"
          />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>Infos pratiques</Eyebrow>
          <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
            Coordonnées et prise de rendez-vous
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="rounded-2xl border border-border bg-surface p-7">
              <ul className="flex flex-col gap-5 text-sm text-muted sm:text-base">
                <li className="flex items-start gap-3">
                  <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span>
                    {siteConfig.address.streetAddress}
                    <br />
                    {siteConfig.address.postalCode} {siteConfig.address.addressLocality}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <IconPhone className="h-5 w-5 shrink-0 text-accent" />
                  <a
                    href={`tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`}
                    className="no-underline hover:text-accent"
                  >
                    {siteConfig.phone}
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-4">
              {team.map((member) => (
                <Link
                  key={member.slug}
                  href={member.doctolibUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary whitespace-nowrap"
                >
                  Rendez-vous avec {member.name}
                </Link>
              ))}
              <CTALink href="/contact" variant="secondary">
                Nous contacter
              </CTALink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>Nos spécialités</Eyebrow>
          <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
            Trois domaines d&apos;expertise, un seul objectif : votre confort
          </h2>
          <div className="mt-10">
            <SpecialtyGrid specialties={specialties} />
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>L&apos;équipe</Eyebrow>
          <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
            Deux chirurgiens-dentistes à votre écoute
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {team.map((member) => (
              <div
                key={member.slug}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-7 sm:flex-row sm:items-start"
              >
                <a
                  href={member.photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.photoAlt} - ouvrir l'image en grand`}
                  className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-border bg-surface"
                >
                  <Image
                    src={member.photo}
                    alt={member.photoAlt}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </a>
                <div>
                  <p className="text-lg text-ink">{member.name}</p>
                  <p className="mt-1 text-sm font-medium text-accent">
                    {member.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {member.bio}
                  </p>
                  <Link
                    href={member.doctolibUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary mt-4 !px-4 !py-2 text-sm"
                  >
                    Rendez-vous avec le {member.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-site py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="flex flex-col gap-3">
              <IconShield className="h-10 w-10 text-accent" />
              <h3 className="text-xl text-ink">Hygiène et sécurité</h3>
              <p className="text-sm leading-relaxed text-muted">
                Des protocoles stricts de stérilisation et de désinfection,
                appliqués à chaque étape des soins.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <IconSparkleSmile className="h-10 w-10 text-accent" />
              <h3 className="text-xl text-ink">Approche personnalisée</h3>
              <p className="text-sm leading-relaxed text-muted">
                Chaque traitement est expliqué en langage simple, avant
                toute décision, pour que vous restiez acteur de vos soins.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <IconCalendar className="h-10 w-10 text-accent" />
              <h3 className="text-xl text-ink">Prise de rendez-vous simple</h3>
              <p className="text-sm leading-relaxed text-muted">
                Réservez un créneau en ligne via Doctolib ou contactez
                directement le cabinet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl sm:text-4xl">
              Une question, un besoin de rendez-vous ?
            </h2>
            <p className="mt-3 max-w-md text-muted">
              L&apos;équipe du cabinet vous répond et vous accompagne dans
              vos démarches.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <CTALink href="/contact">Contacter le cabinet</CTALink>
            {team.map((member) => (
              <Link
                key={member.slug}
                href={member.doctolibUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary whitespace-nowrap"
              >
                Doctolib - {member.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
