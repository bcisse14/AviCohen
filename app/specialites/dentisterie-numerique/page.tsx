import type { Metadata } from "next";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { PageHero } from "@/components/PageHero";
import { Figure } from "@/components/Figure";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { MoreDetails } from "@/components/MoreDetails";
import { CTALink, Eyebrow } from "@/components/ui";
import { IconCalendar } from "@/components/icons";
import { specialties, siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Dentisterie numérique (CFAO)",
  description:
    "La dentisterie numérique au cabinet des Docteurs Cohen à Paris 12e : empreintes optiques, conception et fabrication assistées par ordinateur (CFAO).",
  openGraph: {
    title: `Dentisterie numérique (CFAO) - ${siteConfig.practiceName}`,
    description:
      "Empreintes optiques, conception et fabrication assistées par ordinateur pour des soins plus précis.",
    images: ["/images/numerique-salle-vue-ensemble.jpg"],
  },
};

const numerique = specialties.find((s) => s.slug === "dentisterie-numerique");
const detailPrinterImageSrc = "/images/cfao-imprimante-3d-detail.jpg";
const hasDetailPrinterImage = existsSync(
  join(process.cwd(), "public", "images", "cfao-imprimante-3d-detail.jpg"),
);

const detailsNumerique = [
  {
    title: "L'empreinte optique",
    paragraphs: [
      "Un scanner intra oral capture directement la bouche du patient, sans pâte ni porte empreinte. Le modèle numérique obtenu est visible à l'écran presque instantanément.",
    ],
  },
  {
    title: "La conception assistée par ordinateur",
    paragraphs: [
      "À partir de cette empreinte, la restauration (couronne, facette, inlay ou onlay) est modélisée numériquement. Cette étape permet d'ajuster la forme et les proportions avant toute fabrication.",
    ],
  },
  {
    title: "La fabrication assistée par ordinateur",
    paragraphs: [
      "Une fois le projet validé, les données sont envoyées vers les outils de fabrication du cabinet, qui produisent la restauration directement sur place, en réduisant les délais et le nombre de rendez-vous nécessaires.",
    ],
  },
  {
    title: "Les avantages de cette approche",
    paragraphs: [
      "Une céramique biocompatible et sans métal, une précision renforcée par la numérisation, un confort accru pour le patient, et dans de nombreux cas, un traitement réalisable en une seule séance.",
    ],
  },
];

export default function DentisterieNumeriquePage() {
  const images = numerique?.images ?? [];

  return (
    <>
      <PageHero
        eyebrow="Spécialité"
        title="Dentisterie numérique (CFAO)"
        description="Le cabinet s'appuie sur des outils numériques récents pour concevoir et fabriquer certaines restaurations dentaires avec précision, directement sur place."
      />

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Empreinte optique</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Adieu la pâte à empreinte
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Le scanner intra oral capture en quelques minutes un modèle
              numérique précis de la bouche, sans pâte ni porte-empreinte.
              Le confort est immédiat et le résultat peut être visualisé
              directement à l&apos;écran avec vous.
            </p>
            <MoreDetails
              heading="Comment fonctionne la CFAO au cabinet"
              items={detailsNumerique}
            />
          </div>
          {images[1] ? (
            <Figure
              src={images[1].src}
              alt={images[1].alt}
              className="aspect-[4/3]"
              priority
            />
          ) : null}
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="lg:order-2">
            <Figure
              src="/images/numerique-opera-system.jpg"
              alt="Écran de conception numérique affichant une reconstruction 3D du sourire"
              className="aspect-[4/3]"
            />
          </div>
          <div className="lg:order-1">
            <Eyebrow>Conception assistée par ordinateur</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Un projet de sourire visualisé avant traitement
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              À partir de l&apos;empreinte numérique, la forme des futures
              restaurations est modélisée sur ordinateur. Cette étape
              permet d&apos;anticiper le rendu final et d&apos;ajuster le
              projet avec vous avant toute fabrication.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Fabrication assistée par ordinateur</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Des restaurations imprimées ou usinées sur place
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Certaines restaurations sont fabriquées directement au
              cabinet grâce à des imprimantes 3D dédiées, ce qui réduit
              les délais et le nombre de rendez-vous nécessaires.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {images[3] ? (
              <Figure
                src={images[3].src}
                alt={images[3].alt}
                className="aspect-[4/3]"
              />
            ) : null}
            {hasDetailPrinterImage ? (
              <Figure
                src={detailPrinterImageSrc}
                alt="Détail d'une imprimante 3D utilisée pour la fabrication assistée par ordinateur"
                className="aspect-[4/3]"
              />
            ) : (
              <ImagePlaceholder
                label="Détail imprimante 3D à venir"
                className="aspect-[4/3]"
              />
            )}
          </div>
        </div>
      </section>

      {images[0] ? (
        <section className="border-b border-border bg-surface">
          <div className="container-site py-16 sm:py-20">
            <Eyebrow>Le plateau numérique</Eyebrow>
            <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
              Un espace dédié aux outils numériques
            </h2>
            <div className="mt-10">
              <Figure
                src={images[0].src}
                alt={images[0].alt}
                className="aspect-[16/9]"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <IconCalendar className="h-9 w-9 text-accent" />
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Des questions sur nos outils numériques ?
            </h2>
          </div>
          <CTALink href="/contact">Contacter le cabinet</CTALink>
        </div>
      </section>
    </>
  );
}
