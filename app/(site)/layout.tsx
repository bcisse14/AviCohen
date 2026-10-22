import { PublicShell } from "@/components/cms/PublicShell";
import { getPublishedDocument } from "@/lib/cms/content";

export const dynamic = "force-dynamic";
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getPublishedDocument();
  return <PublicShell settings={settings}>{children}</PublicShell>;
}
