import type { MetadataRoute } from "next";
import { getPublishedDocument } from "@/lib/cms/content";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages, settings } = await getPublishedDocument();
  return pages.filter((page) => !page.noindex).map((page) => ({
    url: `${settings.url.replace(/\/$/, "")}${page.path}`,
    changeFrequency: "monthly",
    priority: page.path === "/" ? 1 : 0.7,
  }));
}
