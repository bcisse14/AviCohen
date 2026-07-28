import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { Eyebrow, CTALink } from "@/components/ui";
import {
  IconCalendar,
  IconDocument,
  IconShield,
} from "@/components/icons";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Espace patient",
  description:
    "Espace patient du cabinet du Dr Avi Cohen : informations pratiques avant votre venue, prise en charge et réponses aux questions fréquentes.",
  openGraph: {
    title: `Espace patient — ${siteConfig.practiceName}`,
    description:
      "Informations pratiques avant votre venue, prise en charge et réponses aux questions fréquentes.",
  },
};

const documents = [
  "Une pièce d'identité",
  "Votre carte Vitale et votre carte de mutuelle",
  "Vos éventuels examens ou radiographies récents",
  "La liste de vos traitements médicaux en cours",
];

const faq = [
  {
    question: "Comment prendre rendez-vous ?",
    answer:
      "Vous pouvez réserver un créneau en ligne via Doctolib ou contacter directement le secrétariat du cabinet par téléphone ou par e-mail.",
  },
  {
    question: "Le cabinet accepte-t-il les urgences ?",
    answer:
      "Contactez le cabinet dès l'apparition d'une douleur ou d'un traumatisme dentaire : un créneau est recherché dans les meilleurs délais selon les disponibilités.",
  },
  {
    question: "Les soins sont-ils pris en charge par la mutuelle ?",
    answer:
      "Le niveau de prise en charge dépend de votre contrat de mutuelle et du type de soin. Un devis détaillé vous est systématiquement remis avant tout traitement engageant des frais importants.",
  },
  {
    question: "Puis-je venir accompagné à mon rendez-vous ?",
    answer:
      "Oui, notamment pour les enfants ou les personnes ayant besoin d'assistance. Merci de le signaler au secrétariat au moment de la prise de rendez-vous.",
  },
];

export default function EspacePatientPage() {
  return (
    <>
      <PageHero
        eyebrow="Espace patient"
        title="Préparer sereinement votre venue"
        description="Retrouvez ici les informations pratiques utiles avant votre premier rendez-vous, ainsi que les réponses aux questions les plus fréquentes."
      />

      <section className="border-b border-border">
        <div className="container-site grid gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <IconDocument className="h-10 w-10 text-accent" />
            <h2 className="mt-5 text-2xl sm:text-3xl">
              À apporter le jour de votre venue
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {documents.map((doc) => (
                <li key={doc} className="flex items-start gap-3 text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <IconShield className="h-10 w-10 text-accent" />
            <h2 className="mt-5 text-2xl sm:text-3xl">
              Prise en charge et mutuelle
            </h2>
            <p className="mt-6 leading-relaxed text-muted">
              Un devis clair et détaillé vous est proposé avant tout soin
              impliquant des frais significatifs, avec une estimation de
              la part prise en charge par l&apos;Assurance Maladie et
              votre mutuelle. N&apos;hésitez pas à apporter les
              coordonnées de votre contrat pour affiner cette estimation.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-surface">
        <div className="container-site py-16 sm:py-20">
          <Eyebrow>Questions fréquentes</Eyebrow>
          <h2 className="mt-4 max-w-xl text-3xl sm:text-4xl">
            Vous avez une question ?
          </h2>
          <div className="mt-10 flex flex-col gap-4">
            {faq.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-border bg-background p-6"
              >
                <summary className="cursor-pointer list-none text-lg font-medium text-ink marker:content-none">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="text-accent transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 leading-relaxed text-muted">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container-site flex flex-col items-start gap-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <IconCalendar className="h-9 w-9 text-accent" />
            <h2 className="mt-4 text-3xl sm:text-4xl">
              Une question qui n&apos;a pas trouvé de réponse ici ?
            </h2>
          </div>
          <CTALink href="/contact">Contacter le cabinet</CTALink>
        </div>
      </section>
    </>
  );
}
