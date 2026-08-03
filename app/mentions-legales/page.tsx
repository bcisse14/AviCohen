import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site du cabinet des Docteurs Cohen : éditeur, hébergement, propriété intellectuelle et informations de contact.",
  openGraph: {
    title: `Mentions légales - ${siteConfig.practiceName}`,
    description:
      "Informations légales relatives à l'édition, l'hébergement et l'utilisation du site.",
  },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Informations légales"
        title="Mentions légales"
        description="Informations relatives à l'éditeur, à l'hébergement et aux conditions d'utilisation du site."
      />

      <section>
        <div className="container-site space-y-8 py-16 sm:py-20">
          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Éditeur du site</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Le présent site est édité par {siteConfig.practiceName}, situé au {" "}
              {siteConfig.address.streetAddress}, {siteConfig.address.postalCode} {" "}
              {siteConfig.address.addressLocality}.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              Téléphone : {siteConfig.phone}
              <br />
              E-mail : {siteConfig.email}
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Hébergement</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut,
              CA 91789, États-Unis.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Propriété intellectuelle</h2>
            <p className="mt-4 leading-relaxed text-muted">
              L&apos;ensemble des contenus présents sur ce site (textes, images,
              graphismes, logo, vidéos, icônes) est protégé par le droit de la
              propriété intellectuelle. Toute reproduction, représentation,
              modification, publication ou adaptation, totale ou partielle, est
              interdite sans autorisation écrite préalable.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Données personnelles</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Les données transmises via le formulaire de contact sont utilisées
              uniquement pour traiter votre demande. Conformément au Règlement
              Général sur la Protection des Données (RGPD), vous disposez d&apos;un
              droit d&apos;accès, de rectification et de suppression de vos données,
              en adressant votre demande à : {siteConfig.email}.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Cookies</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Le site peut utiliser des cookies techniques nécessaires à son bon
              fonctionnement. En cas d&apos;ajout de cookies de mesure d&apos;audience ou
              tiers, une information spécifique et, si nécessaire, un recueil du
              consentement seront mis en place.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Responsabilité</h2>
            <p className="mt-4 leading-relaxed text-muted">
              L&apos;éditeur du site s&apos;efforce de fournir des informations aussi
              précises que possible. Toutefois, il ne pourra être tenu
              responsable des omissions, inexactitudes ou carences dans la mise
              à jour, qu&apos;elles soient de son fait ou du fait de tiers partenaires.
            </p>
          </article>

          <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-2xl text-ink">Conception et réalisation</h2>
            <p className="mt-4 leading-relaxed text-muted">
              Site réalisé par Karlsefni :{" "}
              <a
                href="https://bafode-cisse.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink no-underline hover:text-accent"
              >
                https://bafode-cisse.vercel.app/
              </a>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
