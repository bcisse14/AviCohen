import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Figure } from "@/components/Figure";
import { Eyebrow } from "@/components/ui";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Le cabinet",
  description:
    "Découvrez le cabinet du Dr Avi Cohen à Paris 12e : un espace de soin moderne, pensé pour l'accueil et le confort des patients.",
  openGraph: {
    title: `Le cabinet - ${siteConfig.practiceName}`,
    description:
      "Découvrez le cabinet du Dr Avi Cohen à Paris 12e : un espace de soin moderne, pensé pour l'accueil et le confort des patients.",
    images: ["/images/accueil-secretariat-01.jpg"],
  },
};

export default function CabinetPage() {
  return (
    <>
      <PageHero
        eyebrow="Le cabinet"
        title="Un cabinet à taille humaine, pensé pour votre confort"
        description="De l'accueil à la salle de soin, chaque espace du cabinet a été conçu pour vous accompagner sereinement, avec des équipements récents et un environnement soigné."
      />

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Figure
            src="/images/accueil-secretariat-01.jpg"
            alt="Accueil et secrétariat du cabinet du Dr Avi Cohen"
            className="aspect-[4/3]"
          />
          <div>
            <Eyebrow>L&apos;accueil</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Un accueil chaleureux, dès votre arrivée
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Le secrétariat du cabinet vous accueille et vous accompagne
              pour toutes les démarches administratives : prise de
              rendez-vous, suivi des dossiers de mutuelle et organisation
              du planning de soin. Un espace pensé pour que l&apos;attente
              reste agréable.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="lg:order-2">
            <Figure
              src="/images/cabinet-salle-soin-03.jpg"
              alt="Salle de soin du cabinet, équipée de matériel dentaire récent"
              className="aspect-[4/3]"
            />
          </div>
          <div className="lg:order-1">
            <Eyebrow>La salle de soin</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Un plateau technique récent, entretenu avec rigueur
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Chaque salle de soin est équipée pour répondre aux besoins de
              l&apos;implantologie, de l&apos;esthétique dentaire et de la
              dentisterie numérique, avec des protocoles d&apos;hygiène
              stricts appliqués avant et après chaque patient.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Figure
            src="/images/espace-attente-couloir.jpg"
            alt="Autre vue de la salle de soin du cabinet du Dr Avi Cohen"
            className="aspect-[4/3]"
          />
          <div>
            <Eyebrow>Le cabinet en un coup d&apos;œil</Eyebrow>
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Une prise en charge claire, à chaque étape
            </h2>
            <p className="mt-5 leading-relaxed text-muted">
              Avant tout soin, le déroulement du traitement, les délais et
              les coûts vous sont expliqués simplement, afin que vous
              puissiez prendre vos décisions en toute confiance.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
