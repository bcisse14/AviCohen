import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Figure } from "@/components/Figure";
import { MoreDetails } from "@/components/MoreDetails";
import { CTALink, Eyebrow } from "@/components/ui";
import {
  IconCalendar,
  IconShield,
  IconSparkleSmile,
  IconTooth,
} from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

const casAvantApres = [
  {
    key: "1",
    avantSrc: "/images/avant_1.jpg",
    avantAlt: "Sourire avant traitement esthétique, cas 1",
    apresSrc: "/images/apres_1.jpg",
    apresAlt: "Sourire après traitement esthétique, cas 1",
  },
  {
    key: "2",
    avantSrc: "/images/avant_2.jpg",
    avantAlt: "Sourire avant traitement esthétique, cas 2",
    apresSrc: "/images/apres_2.jpg",
    apresAlt: "Sourire après traitement esthétique, cas 2",
  },
  {
    key: "3",
    avantSrc: "/images/avant_3.png",
    avantAlt: "Restauration dentaire avant traitement, cas 3",
    apresSrc: "/images/apres_3.png",
    apresAlt: "Restauration dentaire après traitement, cas 3",
  },
];

const montagesAvantApres = [
  {
    src: "/images/avant-apres_1.jpg",
    alt: "Montage photo montrant un avant et un après traitement esthétique",
  },
  {
    src: "/images/avant-apres_2.jpg",
    alt: "Montage photo comparatif avant et après restauration esthétique",
  },
];

const montagePrincipal = montagesAvantApres[0];

export const metadata: Metadata = {
  title: "Esthétique dentaire",
  description:
    "Esthétique dentaire au cabinet du Dr Avi Cohen à Paris 12e : éclaircissement, facettes et harmonisation du sourire, avec un rendu naturel.",
  openGraph: {
    title: `Esthétique dentaire - ${siteConfig.practiceName}`,
    description:
      "Éclaircissement, facettes et harmonisation du sourire, avec un rendu naturel.",
  },
};

const prestations = [
  {
    icon: IconSparkleSmile,
    title: "Éclaircissement dentaire",
    description:
      "Une technique encadrée pour atténuer les taches et redonner de la luminosité au sourire, adaptée à la sensibilité de chaque patient.",
  },
  {
    icon: IconTooth,
    title: "Facettes céramiques",
    description:
      "De fines lamelles collées sur la face visible des dents pour corriger la forme, la teinte ou de petits défauts d'alignement.",
  },
  {
    icon: IconShield,
    title: "Harmonisation du sourire",
    description:
      "Une approche globale qui tient compte du visage, des lèvres et de la fonction masticatoire, pas seulement de la couleur des dents.",
  },
];

const detailsEsthetique = [
  {
    title: "Facettes céramiques en une seule séance",
    paragraphs: [
      "Après préparation de la dent, une empreinte optique remplace l'empreinte traditionnelle. La facette est conçue numériquement puis fabriquée sur place, avant d'être collée directement, souvent en une seule séance.",
    ],
  },
  {
    title: "Couronnes esthétiques",
    paragraphs: [
      "Le même principe s'applique à la réalisation de couronnes complètes, avec un rendu naturel proche de la dent d'origine, sans les délais habituellement nécessaires à un laboratoire externe.",
    ],
  },
  {
    title: "Remplacement d'anciennes restaurations",
    paragraphs: [
      "Les anciens amalgames ou restaurations vieillissantes peuvent être remplacés par des inlays ou onlays en céramique, réalisés eux aussi en une seule séance grâce aux outils numériques du cabinet.",
    ],
  },
];

export default function EsthetiqueDentairePage() {
  return (
    <>
      <PageHero
        eyebrow="Spécialité"
        title="Esthétique dentaire"
        description="Retrouver un sourire naturel et harmonieux, sans compromettre la santé des dents ni la fonction masticatoire."
      />

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>Notre approche</Eyebrow>
            <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
              Un sourire qui vous ressemble
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              L&apos;esthétique dentaire ne se limite pas à blanchir les
              dents : elle consiste à harmoniser la forme, la teinte et
              l&apos;alignement du sourire, en tenant compte des
              proportions naturelles du visage. Chaque traitement est
              proposé après un échange sur vos attentes et un examen
              clinique complet.
            </p>
            <MoreDetails
              heading="Des restaurations esthétiques réalisées avec précision"
              items={detailsEsthetique}
            />
          </div>
          {montagePrincipal ? (
            <Figure
              src={montagePrincipal.src}
              alt={montagePrincipal.alt}
              className="aspect-[4/3]"
              priority
            />
          ) : null}
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {prestations.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-background p-7"
              >
                <item.icon className="h-10 w-10 text-accent" />
                <h3 className="mt-5 text-xl text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>Avant / après</Eyebrow>
          <h2 className="mt-4 max-w-3xl text-3xl sm:text-4xl">
            Exemples de résultats en esthétique dentaire
          </h2>
          <p className="mt-5 max-w-3xl leading-relaxed text-muted">
            Une sélection de cas traités au cabinet pour illustrer les
            possibilités d&apos;harmonisation du sourire selon la situation
            clinique de chaque patient.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {casAvantApres.map((cas) => (
              <article
                key={cas.key}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">
                      Avant
                    </p>
                    <Figure
                      src={cas.avantSrc}
                      alt={cas.avantAlt}
                      className="aspect-[4/3]"
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 40vw, 100vw"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">
                      Après
                    </p>
                    <Figure
                      src={cas.apresSrc}
                      alt={cas.apresAlt}
                      className="aspect-[4/3]"
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 40vw, 100vw"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {montagesAvantApres.map((image) => (
              <Figure
                key={image.src}
                src={image.src}
                alt={image.alt}
                className="aspect-[16/10]"
                sizes="(min-width: 1024px) 42vw, 100vw"
              />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <IconCalendar className="h-9 w-9 text-accent" />
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Envie d&apos;échanger sur votre sourire ?
            </h2>
          </div>
          <CTALink href="/contact">Prendre rendez-vous</CTALink>
        </div>
      </section>
    </>
  );
}
