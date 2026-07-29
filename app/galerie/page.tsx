import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Figure } from "@/components/Figure";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Galerie photo",
  description:
    "Galerie photo du cabinet du Dr Avi Cohen à Paris 12e : découvrez l'ambiance et les espaces du cabinet.",
  openGraph: {
    title: `Galerie photo - ${siteConfig.practiceName}`,
    description:
      "Découvrez l'ambiance et les espaces du cabinet du Dr Avi Cohen.",
    images: ["/images/deco-miroir-detail.jpg"],
  },
};

const photos = [
  {
    src: "/images/accueil-secretariat-02.jpg",
    alt: "Espace accueil et secrétariat du cabinet du Dr Avi Cohen",
    caption: "L'accueil du cabinet",
  },
  {
    src: "/images/cabinet-detail-salle-02.jpg",
    alt: "Détail d'une salle de soin du cabinet du Dr Avi Cohen",
    caption: "Détail d'une salle de soin",
  },
  {
    src: "/images/deco-miroir-detail.jpg",
    alt: "Détail de décoration du cabinet, avec un miroir mettant en valeur l'espace",
    caption: "Un cadre soigné",
  },
];

export default function GaleriePage() {
  return (
    <>
      <PageHero
        eyebrow="Galerie"
        title="Un aperçu du cabinet"
        description="Quelques images pour découvrir l'ambiance et le soin apporté aux espaces du cabinet, avant même votre première visite."
      />

      <section>
        <div className="container-site py-16 sm:py-20">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <li key={photo.src}>
                <figure>
                  <Figure
                    src={photo.src}
                    alt={photo.alt}
                    className="aspect-square"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <figcaption className="mt-3 text-sm text-muted">
                    {photo.caption}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
