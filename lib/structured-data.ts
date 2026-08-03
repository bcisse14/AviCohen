import { siteConfig, team } from "@/lib/site-config";

/**
 * Données structurées schema.org (type Dentist + LocalBusiness) partagées
 * par la page d'accueil et la page contact. Toutes les valeurs
 * proviennent de `lib/site-config.ts` : mettre à jour ce fichier suffit à
 * répercuter le changement partout.
 */
export function getDentistStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: siteConfig.practiceName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.streetAddress,
      postalCode: siteConfig.address.postalCode,
      addressLocality: siteConfig.address.addressLocality,
      addressRegion: siteConfig.address.addressRegion,
      addressCountry: siteConfig.address.addressCountry,
    },
    medicalSpecialty: ["Dentistry"],
    openingHoursSpecification: siteConfig.openingHours.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days,
      description: slot.hours,
    })),
    employee: team.map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.title,
      url: member.doctolibUrl,
    })),
    sameAs: team.map((member) => member.doctolibUrl),
  } as const;
}
