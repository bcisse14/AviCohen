import { z } from "zod";

export function isSafeLink(value: string): boolean {
  if (/[\u0000-\u0020\\]/.test(value)) return false;
  return /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value) ||
    /^mailto:[^@]+@[^@]+$/i.test(value) || /^tel:\+?[\d().-]+$/i.test(value) ||
    /^#[a-zA-Z0-9_-]+$/.test(value);
}

export function isSafeImage(value: string): boolean {
  if (/^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/.test(url.hostname) &&
      !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

const text = z.string().max(30000);
const short = z.string().max(300);
export const linkSchema = z.string().max(2000).refine(isSafeLink, "Lien invalide : utilisez /une-page, https://, mailto: ou tel:.");
export const imageSchema = z.object({
  src: z.string().max(2000).refine(isSafeImage, "Choisissez une image de la médiathèque."),
  alt: z.string().trim().min(1, "Décrivez l'image pour l'accessibilité.").max(500),
  caption: z.string().max(1000).default(""),
  fit: z.enum(["cover", "contain"]).default("cover"),
  position: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  ratio: z.enum(["auto", "square", "landscape", "wide", "portrait"]).default("landscape"),
});
export const buttonSchema = z.object({ label: short.min(1), href: linkSchema });
const date = z.string().refine((v) => v === "" || (v.endsWith("Z") && Number.isFinite(Date.parse(v))), "Date invalide.");

export const blockTypes = ["text", "split", "image", "gallery", "announcement", "faq", "cards", "team", "specialties", "details", "contact", "buttons"] as const;
export const blockLabels: Record<(typeof blockTypes)[number], string> = {
  text: "Texte", split: "Texte et photo", image: "Photo", gallery: "Galerie",
  announcement: "Annonce", faq: "Questions / réponses", cards: "Cartes / étapes",
  team: "Équipe", specialties: "Spécialités", details: "Coordonnées et carte",
  contact: "Formulaire de contact", buttons: "Appel à l'action",
};
export const blockSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(blockTypes),
  eyebrow: short.default(""),
  title: short.default(""),
  body: text.default(""),
  visible: z.boolean().default(true),
  width: z.enum(["compact", "standard", "wide", "full"]).default("standard"),
  background: z.enum(["default", "surface", "accent"]).default("default"),
  align: z.enum(["left", "center"]).default("left"),
  imageSide: z.enum(["left", "right"]).default("right"),
  columns: z.number().int().min(1).max(4).default(3),
  images: z.array(imageSchema).max(100).default([]),
  buttons: z.array(buttonSchema).max(10).default([]),
  items: z.array(z.object({ title: short, body: text })).max(100).default([]),
  startsAt: date.default(""),
  endsAt: date.default(""),
}).superRefine((b, ctx) => {
  if (b.startsAt && b.endsAt && Date.parse(b.endsAt) <= Date.parse(b.startsAt)) {
    ctx.addIssue({ code: "custom", path: ["endsAt"], message: "La fin doit être postérieure au début." });
  }
  if (["split", "image", "gallery"].includes(b.type) && !b.images.length) {
    ctx.addIssue({ code: "custom", path: ["images"], message: "Ajoutez au moins une image." });
  }
});

export const pathSchema = z.string().max(200).refine(
  (value) => value === "/" || (/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(value) &&
    !/^\/(?:admin|api|preview|images|_next)(?:\/|$)/.test(value) &&
    !["/sitemap.xml", "/robots.txt"].includes(value)),
  "Chemin invalide ou réservé. Exemple : /informations/acces",
);
export const pageSchema = z.object({
  id: z.string().min(1).max(100),
  path: pathSchema,
  title: short.min(1),
  description: z.string().max(1000),
  ogImage: z.union([z.literal(""), imageSchema.shape.src]).default(""),
  noindex: z.boolean().default(false),
  blocks: z.array(blockSchema).max(80),
});

export const settingsSchema = z.object({
  name: short.min(1),
  practiceName: short.min(1),
  tagline: short,
  url: z.string().url().max(2000).refine((v) => {
    const url = new URL(v);
    return url.protocol === "https:" && url.pathname === "/" && !url.search && !url.hash && !url.username && !url.password;
  }, "Indiquez l'origine HTTPS du site, sans chemin."),
  description: z.string().max(2000),
  phone: z.string().max(50),
  email: z.string().email().max(254),
  contactRecipient: z.string().email().max(254),
  address: z.object({
    streetAddress: short, postalCode: short, addressLocality: short,
    addressRegion: short, addressCountry: z.string().length(2),
  }),
  openingHours: z.array(z.object({ days: short.min(1), hours: short })).max(30),
  team: z.array(z.object({
    id: short.min(1), name: short.min(1), title: short, bio: text,
    photo: imageSchema, doctolibUrl: linkSchema,
  })).max(30),
  specialties: z.array(z.object({
    id: short.min(1), title: short.min(1), summary: text, href: linkSchema,
  })).max(30),
  navigation: z.array(z.object({
    label: short.min(1), href: linkSchema,
    children: z.array(buttonSchema).max(30).default([]),
  })).max(30),
  footerLinks: z.array(buttonSchema).max(30),
  credit: buttonSchema,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur au format #c9a24b."),
  announcements: z.array(blockSchema).max(20).refine((blocks) => blocks.every((b) => b.type === "announcement"), "Seules les annonces sont autorisées ici."),
});

export const documentSchema = z.object({
  settings: settingsSchema,
  pages: z.array(pageSchema).min(1).max(100),
}).superRefine((doc, ctx) => {
  const paths = new Set<string>();
  const ids = new Set<string>();
  for (const [index, page] of doc.pages.entries()) {
    if (paths.has(page.path) || ids.has(page.id)) {
      ctx.addIssue({ code: "custom", path: ["pages", index, "path"], message: "Chaque page doit avoir un identifiant et un chemin uniques." });
    }
    paths.add(page.path);
    ids.add(page.id);
    const blockIds = page.blocks.map((b) => b.id);
    if (new Set(blockIds).size !== blockIds.length) {
      ctx.addIssue({ code: "custom", path: ["pages", index, "blocks"], message: "Identifiants de blocs en double." });
    }
  }
  if (!paths.has("/")) ctx.addIssue({ code: "custom", path: ["pages"], message: "La page d'accueil est obligatoire." });
  for (const item of [...doc.settings.navigation.flatMap((n) => [n, ...n.children]), ...doc.settings.footerLinks]) {
    if (item.href.startsWith("/") && !paths.has(item.href)) {
      ctx.addIssue({ code: "custom", path: ["settings", "navigation"], message: `Le lien ${item.href} ne correspond à aucune page.` });
    }
  }
});

export type CmsImage = z.infer<typeof imageSchema>;
export type Block = z.infer<typeof blockSchema>;
export type CmsPage = z.infer<typeof pageSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type CmsDocument = z.infer<typeof documentSchema>;
export type Media = CmsImage & { id: string; name: string; uploadedAt: string; width: number; height: number };

export function newBlock(type: Block["type"]): Block {
  const block = {
    id: crypto.randomUUID(), type, eyebrow: "", title: "", body: "", visible: true,
    width: "standard" as const, background: "default" as const, align: "left" as const,
    imageSide: "right" as const, columns: 3, images: [], buttons: [], items: [],
    startsAt: "", endsAt: "",
  };
  return block;
}

export function isBlockVisible(block: Block, now = Date.now()): boolean {
  return block.visible && (!block.startsAt || Date.parse(block.startsAt) <= now) &&
    (!block.endsAt || Date.parse(block.endsAt) > now);
}
