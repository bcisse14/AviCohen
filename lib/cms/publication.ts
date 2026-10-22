import { z } from "zod";
import { documentSchema, type CmsDocument } from "./schema";

const id = z.string().min(1).max(100);
export const publicationTargetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("announcement"), id }),
  z.object({ type: z.literal("block"), pageId: id, id }),
  z.object({ type: z.literal("page"), pageId: id }),
  z.object({ type: z.literal("settings") }),
  z.object({ type: z.literal("remove-announcement"), id, pageId: id.optional() }),
  z.object({ type: z.literal("remove-all-announcements") }),
]);
export type PublicationTarget = z.infer<typeof publicationTargetSchema>;
export class PublicationError extends Error {}

export function removeAnnouncements(document: CmsDocument, target: PublicationTarget): CmsDocument {
  if (target.type !== "remove-announcement" && target.type !== "remove-all-announcements") return document;
  const all = target.type === "remove-all-announcements";
  return {
    ...document,
    settings: {
      ...document.settings,
      announcements: document.settings.announcements.filter((block) => !all && (target.pageId !== undefined || block.id !== target.id)),
    },
    pages: document.pages.map((page) => ({
      ...page,
      blocks: page.blocks.filter((block) => block.type !== "announcement" ||
        (!all && (page.id !== target.pageId || block.id !== target.id))),
    })),
  };
}

function replaceItem<T extends { id: string }>(published: T[], draft: T[], id: string): T[] {
  const item = draft.find((entry) => entry.id === id);
  if (!item) throw new PublicationError("L’élément à publier n’existe plus dans le brouillon.");
  if (published.some((entry) => entry.id === id)) {
    return published.map((entry) => entry.id === id ? item : entry);
  }
  const index = draft.findIndex((entry) => entry.id === id);
  const previous = draft.slice(0, index).reverse().find((entry) => published.some((live) => live.id === entry.id));
  const following = draft.slice(index + 1).find((entry) => published.some((live) => live.id === entry.id));
  const insertion = previous ? published.findIndex((entry) => entry.id === previous.id) + 1
    : following ? published.findIndex((entry) => entry.id === following.id) : published.length;
  return [...published.slice(0, insertion), item, ...published.slice(insertion)];
}

export function publishSelection(published: CmsDocument, draft: CmsDocument, target: PublicationTarget): CmsDocument {
  if (target.type === "remove-announcement" || target.type === "remove-all-announcements") {
    if (target.type === "remove-announcement") {
      const exists = [published, draft].some((document) => target.pageId === undefined
        ? document.settings.announcements.some((block) => block.id === target.id)
        : document.pages.some((page) => page.id === target.pageId &&
          page.blocks.some((block) => block.id === target.id && block.type === "announcement")));
      if (!exists) throw new PublicationError("L’annonce à retirer est introuvable. Rechargez l’administration.");
    }
    return documentSchema.parse(removeAnnouncements(published, target));
  }
  const next = structuredClone(published);
  if (target.type === "settings") {
    next.settings = { ...draft.settings, announcements: next.settings.announcements };
  } else if (target.type === "announcement") {
    next.settings.announcements = replaceItem(next.settings.announcements, draft.settings.announcements, target.id);
  } else {
    const page = draft.pages.find((entry) => entry.id === target.pageId);
    if (!page) throw new PublicationError("La page à publier n’existe plus dans le brouillon.");
    if (target.type === "page") {
      next.pages = replaceItem(next.pages, draft.pages, target.pageId);
      next.redirects = next.redirects.filter((entry) => entry.pageId !== page.id);
      next.redirects.push(...draft.redirects.filter((entry) => entry.pageId === page.id));
      const oldPage = published.pages.find((entry) => entry.id === page.id);
      if (oldPage && oldPage.path !== page.path && !next.redirects.some((entry) => entry.from === oldPage.path)) {
        next.redirects.push({ from: oldPage.path, pageId: page.id });
      }
    } else {
      const livePage = next.pages.find((entry) => entry.id === target.pageId);
      if (!livePage) throw new PublicationError("Cette page n’est pas encore en ligne. Publiez d’abord la page entière avant de publier ses blocs séparément.");
      livePage.blocks = replaceItem(livePage.blocks, page.blocks, target.id);
    }
  }
  const result = documentSchema.safeParse(next);
  if (!result.success) {
    throw new PublicationError(`Publication individuelle impossible : ${result.error.issues.map((issue) => issue.message).join(" ")} Publiez d’abord les pages nécessaires ou corrigez les liens et les limites de contenu.`);
  }
  return result.data;
}
