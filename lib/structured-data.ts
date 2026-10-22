import type { Settings } from "@/lib/cms/schema";

/**
 * Données structurées schema.org (type Dentist + LocalBusiness) partagées
 * par la page d'accueil et la page contact. Toutes les valeurs
 * proviennent des réglages publiés dans le CMS.
 */
export function getDentistStructuredData(siteConfig: Settings) {
  const { team } = siteConfig;
  const contactEmails = [siteConfig.email, ...siteConfig.additionalEmails];
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: siteConfig.practiceName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.phone,
    email: contactEmails,
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
