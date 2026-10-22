import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Blocks } from "@/components/cms/Blocks";
import { PublicShell } from "@/components/cms/PublicShell";
import { isAuthenticated } from "@/lib/cms/auth";
import { repository } from "@/lib/cms/repository";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prévisualisation privée", robots: { index: false, follow: false }, alternates: { canonical: null } };
export default async function PreviewPage({ params }: { params: { id: string } }) {
  if (!isAuthenticated()) redirect("/admin");
  const { draft } = await repository.getState();
  const page = draft.pages.find((p) => p.id === params.id);
  if (!page) notFound();
  return <>
    <div className="border-b border-accent bg-surface p-4 text-center">Prévisualisation privée du brouillon enregistré : le site public est inchangé. <Link className="ml-4 text-accent" href="/admin">Retour à l’administration</Link></div>
    <PublicShell settings={draft.settings} preview><Blocks blocks={page.blocks} settings={draft.settings} scope={`preview:${page.id}`} /></PublicShell>
  </>;
}
