import type { MetadataRoute } from "next";
import { getPublishedDocument } from "@/lib/cms/content";

export const dynamic = "force-dynamic";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { settings } = await getPublishedDocument();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/admin/", "/preview/"],
    },
    sitemap: `${settings.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
