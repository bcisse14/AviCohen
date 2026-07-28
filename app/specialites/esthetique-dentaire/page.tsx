import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { CTALink, Eyebrow } from "@/components/ui";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import {
  IconCalendar,
  IconShield,
  IconSparkleSmile,
  IconTooth,
} from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Esthétique dentaire",
  description:
    "Esthétique dentaire au cabinet du Dr Avi Cohen à Paris 12e : éclaircissement, facettes et harmonisation du sourire, avec un rendu naturel.",
  openGraph: {
    title: `Esthétique dentaire — ${siteConfig.practiceName}`,
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
          </div>
          <ImagePlaceholder className="aspect-[4/3]" />
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
