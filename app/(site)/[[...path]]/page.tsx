import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Blocks } from "@/components/cms/Blocks";
import { StructuredData } from "@/components/StructuredData";
import { getPublishedDocument } from "@/lib/cms/content";
import { getDentistStructuredData } from "@/lib/structured-data";
import { isBlockVisible } from "@/lib/cms/schema";

type Props = { params: { path?: string[] } };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await getPublishedDocument();
  const path = "/" + (params.path || []).join("/");
  const page = doc.pages.find((p) => p.path === path);
  if (!page) return { title: "Page introuvable", robots: { index: false } };
  return {
    title: path === "/" ? { absolute: `${doc.settings.practiceName} - ${doc.settings.tagline}` } : page.title,
    description: page.description, alternates: { canonical: path },
    robots: { index: !page.noindex, follow: true },
    openGraph: { title: page.title, description: page.description, url: path, images: page.ogImage ? [page.ogImage] : [] },
  };
}
export default async function CmsPublicPage({ params }: Props) {
  const { pages, settings, redirects } = await getPublishedDocument();
  const path = "/" + (params.path || []).join("/");
  const page = pages.find((p) => p.path === path);
  const alias = redirects.find((redirect) => redirect.from === path);
  if (!page && alias) {
    const target = pages.find((p) => p.id === alias.pageId);
    if (target) permanentRedirect(target.path);
  }
  if (!page) notFound();
  return <>
    <StructuredData data={getDentistStructuredData(settings)} />
    {!page.blocks.some((b) => isBlockVisible(b) && b.type !== "announcement" && b.title) && <h1 className="sr-only">{page.title}</h1>}
    <Blocks blocks={page.blocks} settings={settings} scope={page.id} />
  </>;
}
