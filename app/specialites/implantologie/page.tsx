import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CTALink, Eyebrow } from "@/components/ui";
import { Figure } from "@/components/Figure";
import { IconCalendar, IconImplant, IconShield, IconTooth } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Implantologie dentaire",
  description:
    "L'implantologie dentaire au cabinet du Dr Avi Cohen à Paris 12e : remplacement durable des dents manquantes, étapes du traitement et suivi personnalisé.",
  openGraph: {
    title: `Implantologie dentaire - ${siteConfig.practiceName}`,
    description:
      "Remplacement durable des dents manquantes par implants, avec un suivi personnalisé à chaque étape.",
  },
};

const etapes = [
  {
    title: "Bilan et plan de traitement",
    description:
      "Un examen clinique complet, appuyé si besoin par une imagerie 3D, permet d'évaluer la quantité et la qualité osseuse avant de définir le plan de traitement le mieux adapté.",
  },
  {
    title: "Pose de l'implant",
    description:
      "L'implant, une petite vis en titane biocompatible, est positionné dans l'os maxillaire sous anesthésie locale, dans des conditions d'asepsie strictes.",
  },
  {
    title: "Cicatrisation osseuse",
    description:
      "L'os se consolide progressivement autour de l'implant au cours des semaines suivantes, un phénomène appelé ostéo intégration.",
  },
  {
    title: "Pose de la couronne",
    description:
      "Une fois l'implant stable, une couronne sur mesure est fixée dessus pour retrouver une dent fonctionnelle et esthétique.",
  },
];

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
            src="/images/structure-implant-dentaire.webp"
            alt="Structure d'un implant dentaire"
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
