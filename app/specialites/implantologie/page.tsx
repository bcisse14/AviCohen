import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CTALink, Eyebrow } from "@/components/ui";
import { Figure } from "@/components/Figure";
import { IconCalendar, IconImplant, IconShield, IconTooth } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Implantologie dentaire",
  description:
    "L'implantologie dentaire au cabinet des Docteurs Cohen à Paris 12e : remplacement durable des dents manquantes, étapes du traitement et suivi personnalisé.",
  openGraph: {
    title: `Implantologie dentaire - ${siteConfig.practiceName}`,
    description:
      "Remplacement durable des dents manquantes par implants, avec un suivi personnalisé à chaque étape.",
  },
};

const etapes = [
  {
    title: "Première phase : la pose de l'implant",
    description:
      "L'intervention se déroule sous anesthésie locale. Le praticien ouvre la gencive au niveau de la zone édentée, prépare un petit logement dans l'os, puis met en place l'implant. La gencive est ensuite refermée.",
  },
  {
    title: "Une dizaine de jours plus tard",
    description:
      "Les fils de suture sont retirés. Une couronne provisoire peut être posée à ce stade si nécessaire.",
  },
  {
    title: "La période de cicatrisation",
    description:
      "Pendant trois à six mois, l'os se consolide progressivement autour de l'implant, un phénomène appelé ostéointégration. C'est un processus comparable à la consolidation d'une fracture osseuse.",
  },
  {
    title: "Deuxième phase : la mise en charge",
    description:
      "Une petite ouverture de la gencive permet de découvrir l'implant. Une vis de cicatrisation est mise en place, puis remplacée une semaine plus tard par un pilier implantaire, qui fait l'intermédiaire entre l'implant et la future couronne. Une empreinte est alors prise avant la pose de la couronne définitive.",
  },
  {
    title: "Le suivi au quotidien",
    description:
      "Tout porteur d'implant doit maintenir une hygiène bucco dentaire rigoureuse, matin et soir, et effectuer un contrôle clinique et radiologique une fois par an.",
  },
];

const resultatsImplantologie = [
  {
    src: "/images/implantologie_1.webp",
    alt: "Avant et après réhabilitation implantaire du sourire",
    title: "Cas clinique 1",
    description:
      "Restauration de la fonction et de l'esthétique avec un résultat stable et naturel.",
  },
  {
    src: "/images/implantologie_2.webp",
    alt: "Résultat de traitement implantaire avec intégration esthétique",
    title: "Cas clinique 2",
    description:
      "Rééquilibrage du sourire et amélioration de l'alignement prothétique après traitement.",
  },
];

const visuelPrincipalImplantologie = {
  src: "/images/implantologie_1.webp",
  alt: "Avant et après réhabilitation implantaire du sourire",
};

export default function ImplantologiePage() {
  return (
    <>
      <PageHero
        eyebrow="Spécialité"
        title="Implantologie dentaire"
        description="Une solution durable pour remplacer une ou plusieurs dents manquantes, en restaurant à la fois la fonction masticatoire et l'esthétique du sourire."
      />

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Figure
            src={visuelPrincipalImplantologie.src}
            alt={visuelPrincipalImplantologie.alt}
            className="aspect-[4/3]"
            priority
          />
          <div>
            <IconImplant className="h-12 w-12 text-accent" />
            <h2 className="mt-5 text-2xl sm:text-3xl">
              Qu&apos;est-ce qu&apos;un implant dentaire ?
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Un implant dentaire est une racine artificielle, le plus
              souvent en titane, insérée chirurgicalement dans l&apos;os de
              la mâchoire. Une fois intégré, il sert de support à une
              couronne, un bridge ou une prothèse amovible, selon la
              situation de chaque patient. Cette solution évite de
              tailler les dents voisines, contrairement à un bridge
              classique.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>Déroulement</Eyebrow>
          <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
            Les grandes étapes d&apos;un traitement implantaire
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {etapes.map((etape, index) => (
              <div
                key={etape.title}
                className="rounded-2xl border border-border bg-background p-7"
              >
                <span className="eyebrow">Étape {index + 1}</span>
                <h3 className="mt-3 text-xl text-ink">{etape.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {etape.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>Résultats cliniques</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-3xl sm:text-4xl">
            Exemples de restaurations en implantologie
          </h2>
          <p className="mt-5 max-w-3xl leading-relaxed text-muted">
            Ces cas illustrent des situations traitées au cabinet, avec une
            attention portée à la stabilité du résultat et à l&apos;intégration
            esthétique dans le sourire.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {resultatsImplantologie.map((cas) => (
              <article
                key={cas.src}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
              >
                <Figure
                  src={cas.src}
                  alt={cas.alt}
                  className="aspect-[4/3]"
                  sizes="(min-width: 1024px) 42vw, 100vw"
                />
                <h3 className="mt-4 text-xl text-ink">{cas.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {cas.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <IconShield className="h-10 w-10 text-accent" />
            <h3 className="text-xl text-ink">Un suivi rigoureux</h3>
            <p className="text-sm leading-relaxed text-muted">
              La cicatrisation et l&apos;intégration de l&apos;implant sont
              suivies à chaque rendez-vous, pour s&apos;assurer de la
              bonne évolution du traitement.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <IconTooth className="h-10 w-10 text-accent" />
            <h3 className="text-xl text-ink">Un résultat durable</h3>
            <p className="text-sm leading-relaxed text-muted">
              Bien entretenu, un implant dentaire peut accompagner un
              patient de nombreuses années, avec un aspect proche
              d&apos;une dent naturelle.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <IconCalendar className="h-9 w-9 text-accent" />
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Une question sur l&apos;implantologie ?
            </h2>
          </div>
          <CTALink href="/contact">Échanger avec le cabinet</CTALink>
        </div>
      </section>
    </>
  );
}
