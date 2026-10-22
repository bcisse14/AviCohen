import type { Block, CmsDocument, CmsImage, Media } from "./schema";

export function collectOriginalMedia(document: CmsDocument): Media[] {
  const images: CmsImage[] = [
    ...document.pages.flatMap((p) => p.blocks.flatMap((b) => b.images)),
    ...document.settings.team.map((member) => member.photo),
  ];
  const unique = [...new Map(images.map((image) => [image.src, image])).values()];
  return unique.map((image, i) => ({
    ...image, id: `original-${i}`, name: image.src.split("/").pop() || image.alt,
    uploadedAt: "", width: 0, height: 0,
  }));
}
export function renamePage(document: CmsDocument, id: string, nextPath: string): CmsDocument {
  const previous = document.pages.find((page) => page.id === id)?.path;
  if (!previous || previous === nextPath) return document;
  const link = (value: string) => value === previous || value.startsWith(`${previous}#`) || value.startsWith(`${previous}?`)
    ? nextPath + value.slice(previous.length) : value;
  const body = (value: string) => value.replace(/\]\((\/[^)\s]*)\)/g, (_, href: string) => `](${link(href)})`);
  const block = (b: Block): Block => ({
    ...b, body: body(b.body), buttons: b.buttons.map((button) => ({ ...button, href: link(button.href) })),
    items: b.items.map((item) => ({ ...item, body: body(item.body) })),
  });
  const settings = document.settings;
  return {
    redirects: [
      ...document.redirects.filter((redirect) => redirect.from !== nextPath),
      ...(document.redirects.some((redirect) => redirect.from === previous) ? [] : [{ from: previous, pageId: id }]),
    ],
    pages: document.pages.map((page) => ({ ...page, path: page.id === id ? nextPath : page.path, blocks: page.blocks.map(block) })),
    settings: {
      ...settings, navigation: settings.navigation.map((item) => ({
        ...item, href: link(item.href), children: item.children.map((child) => ({ ...child, href: link(child.href) })),
      })),
      footerLinks: settings.footerLinks.map((item) => ({ ...item, href: link(item.href) })),
      credit: { ...settings.credit, href: link(settings.credit.href) },
      description: body(settings.description),
      specialties: settings.specialties.map((item) => ({ ...item, href: link(item.href), summary: body(item.summary) })),
      team: settings.team.map((member) => ({ ...member, doctolibUrl: link(member.doctolibUrl), bio: body(member.bio) })),
      announcements: settings.announcements.map(block),
    },
  };
}
