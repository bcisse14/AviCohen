import type { Metadata } from "next";
import { isAuthenticated, configurationIssues } from "@/lib/cms/auth";
import { repository } from "@/lib/cms/repository";
import { initialDocument } from "@/lib/cms/seed";
import { collectOriginalMedia } from "@/lib/cms/editing";
import { Login } from "@/components/cms/admin/Login";
import { Editor } from "@/components/cms/admin/Editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const missing = configurationIssues();
  if (missing.length) return <main className="mx-auto max-w-2xl px-5 py-20">
    <section className="cms-panel space-y-5"><h1 className="text-3xl">Configuration initiale du CMS</h1>
      <p>L’administration reste fermée tant que les services et les identifiants ne sont pas configurés. Le site public conserve son contenu initial.</p>
      <p className="text-sm text-muted">Variables manquantes ou invalides (valeurs à définir dans les secrets de l’hébergeur) :</p>
      <ul className="list-disc space-y-2 pl-6">{missing.map((key) => <li key={key}><code>{key}</code></li>)}</ul>
      <p className="text-sm">Générez l’empreinte du mot de passe et la clé de session avec <code>npm run cms:password</code>. Reliez une base PostgreSQL Neon et, pour les imports, un stockage public Vercel Blob.</p>
      <p className="text-sm text-muted">Ne transmettez jamais les clés ni le mot de passe dans un message ou un dépôt Git.</p>
    </section>
  </main>;
  if (!isAuthenticated()) return <main className="px-5 py-20"><Login /></main>;
  const [state, uploadedMedia] = await Promise.all([repository.getState(), repository.media()]);
  return <Editor initialState={state} originalMedia={collectOriginalMedia(initialDocument)}
    uploadedMedia={uploadedMedia} uploadsEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)} />;
}
