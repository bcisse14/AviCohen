/**
 * Configuration centrale du site.
 *
 * IMPORTANT : ce fichier regroupe toutes les informations encore
 * provisoires ou non confirmées par le client (adresse exacte, téléphone,
 * horaires, nom de domaine, lien Doctolib, e-mail de réception du
 * formulaire). Elles sont marquées "TODO" ci-dessous.
 *
 * Objectif : pouvoir mettre à jour ces informations en modifiant
 * uniquement ce fichier, sans toucher aux pages.
 */

export const siteConfig = {
  name: "Dr Avi Cohen",
  practiceName: "Cabinet du Dr Avi Cohen",
  tagline: "Chirurgien-dentiste à Paris 12e",
  // TODO (client) : remplacer par le nom de domaine définitif une fois
  // réservé. Utilisé pour le sitemap, robots.txt, Open Graph et les
  // données structurées.
  url: "https://www.dr-avi-cohen-dentiste.fr",
  locale: "fr_FR",
  description:
    "Cabinet dentaire du Dr Avi Cohen à Paris 12e, spécialisé en implantologie, esthétique dentaire et dentisterie numérique (CFAO).",
  address: {
    // TODO (client) : adresse postale exacte non communiquée. À
    // compléter avant mise en ligne (obligatoire pour le référencement
    // local et les données structurées).
    streetAddress: "Adresse à confirmer",
    postalCode: "75012",
    addressLocality: "Paris",
    addressRegion: "Île-de-France",
    addressCountry: "FR",
  },
  // TODO (client) : numéro de téléphone non communiqué.
  phone: "+33 1 00 00 00 00",
  // TODO (client) : e-mail de contact non communiqué. Sert aussi de
  // destinataire par défaut pour le formulaire si la variable
  // d'environnement CONTACT_EMAIL_TO n'est pas définie.
  email: "contact@dr-avi-cohen-dentiste.fr",
  // TODO (client) : horaires réels non communiqués.
  openingHours: [
    { days: "Lundi - Vendredi", hours: "9h00 - 19h00" },
    { days: "Samedi", hours: "9h00 - 13h00" },
    { days: "Dimanche", hours: "Fermé" },
  ],
  // Lien Doctolib générique, utilisé en repli si aucun dentiste n'est
  // précisé. Les liens de réservation réels, propres à chaque
  // dentiste, sont définis dans `team` ci-dessous.
  doctolibUrl:
    "https://www.doctolib.fr/dentiste/paris/avi-cohen/booking/places?specialityId=1&telehealth=false&profile_skipped=true&source=external_referral",
  socials: {
    // TODO (client) : réseaux sociaux non communiqués (optionnel).
  },
} as const;

export type TeamMember = {
  slug: string;
  name: string;
  title: string;
  photo: string;
  photoAlt: string;
  bio: string;
  doctolibUrl: string;
};

export const team: TeamMember[] = [
  {
    slug: "avi-cohen",
    name: "Dr Avi Cohen",
    title: "Chirurgien-dentiste",
    photo: "/images/Cohen_avi.webp",
    photoAlt: "Portrait du Dr Avi Cohen, chirurgien-dentiste",
    bio: "Le Dr Avi Cohen exerce au cabinet et accompagne ses patients en implantologie, esthétique dentaire et dentisterie numérique, avec une attention constante portée à la clarté des explications avant chaque soin.",
    doctolibUrl:
      "https://www.doctolib.fr/dentiste/paris/avi-cohen/booking/places?specialityId=1&telehealth=false&profile_skipped=true&source=external_referral",
  },
  {
    slug: "gilles-cohen",
    name: "Dr Gilles Cohen",
    title: "Chirurgien-dentiste associé",
    photo: "/images/Cohen_Gilles.webp",
    photoAlt: "Portrait du Dr Gilles Cohen, chirurgien-dentiste associé",
    // TODO (client) : spécialité ou parcours de Gilles Cohen non
    // communiqués à ce jour. Bio volontairement générale, à préciser dès
    // réception d'informations complémentaires.
    bio: "Le Dr Gilles Cohen est chirurgien-dentiste associé au sein du cabinet. Sa présentation détaillée sera complétée dès que ses informations professionnelles seront confirmées.",
    doctolibUrl:
      "https://www.doctolib.fr/dentiste/paris/gilles-cohen/booking/motives?specialityId=1&telehealth=false&placeId=practice-262&profile_skipped=true&source=external_referral",
  },
];

export type Specialty = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  href: string;
  /**
   * Indique si des photographies réelles du cabinet existent pour cette
   * spécialité. Tant que le client n'a pas fourni de photos,
   * laisser à `false` : la page affichera des icônes vectorielles
   * génériques à la place. Dès que des photos seront disponibles,
   * ajouter les fichiers dans /public/images et passer ce champ à
   * `true` (et renseigner `images`).
   */
  hasPhotos: boolean;
  images?: { src: string; alt: string }[];
};

export const specialties: Specialty[] = [
  {
    slug: "implantologie",
    title: "Implantologie dentaire",
    shortTitle: "Implantologie",
    summary:
      "Remplacement durable des dents manquantes grâce à des implants intégrés chirurgicalement dans l'os maxillaire.",
    href: "/specialites/implantologie",
    // TODO (client) : aucune photo disponible pour cette spécialité à ce
    // jour. Dès réception de photos, passer hasPhotos à true et
    // renseigner le tableau images.
    hasPhotos: false,
  },
  {
    slug: "esthetique-dentaire",
    title: "Esthétique dentaire",
    shortTitle: "Esthétique dentaire",
    summary:
      "Des soins pensés pour harmoniser la forme, la teinte et l'alignement du sourire, avec un rendu naturel.",
    href: "/specialites/esthetique-dentaire",
    // TODO (client) : aucune photo disponible pour cette spécialité à ce
    // jour. Dès réception de photos, passer hasPhotos à true et
    // renseigner le tableau images.
    hasPhotos: false,
  },
  {
    slug: "dentisterie-numerique",
    title: "Dentisterie numérique (CFAO)",
    shortTitle: "Dentisterie numérique",
    summary:
      "Empreintes optiques, conception et fabrication assistées par ordinateur pour des soins plus précis et plus rapides.",
    href: "/specialites/dentisterie-numerique",
    hasPhotos: true,
    images: [
      {
        src: "/images/numerique-salle-vue-ensemble.jpg",
        alt: "Vue d'ensemble de la salle équipée pour la dentisterie numérique du cabinet",
      },
      {
        src: "/images/numerique-scanner-intraoral.jpg",
        alt: "Scanner intra oral utilisé pour réaliser des empreintes numériques sans pâte",
      },
      {
        src: "/images/numerique-opera-system.jpg",
        alt: "Poste de conception numérique du sourire utilisé au cabinet",
      },
      {
        src: "/images/cfao-imprimantes-3d-ensemble.jpg",
        alt: "Ensemble des imprimantes 3D du cabinet dédiées à la fabrication assistée par ordinateur",
      },
    ],
  },
];

export const navigation = [
  { label: "Accueil", href: "/" },
  { label: "Le cabinet", href: "/cabinet" },
  {
    label: "Spécialités",
    href: "/specialites/implantologie",
    children: specialties.map((s) => ({ label: s.shortTitle, href: s.href })),
  },
  { label: "Galerie", href: "/galerie" },
  { label: "Espace patient", href: "/espace-patient" },
  { label: "Contact", href: "/contact" },
];
