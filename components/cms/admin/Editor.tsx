"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { blockLabels, blockTypes, documentSchema, newBlock, pathSchema, type Block, type CmsDocument, type CmsImage, type CmsPage, type Media } from "@/lib/cms/schema";
import type { CmsState } from "@/lib/cms/repository";
import { renamePage } from "@/lib/cms/editing";
import { BlockEditor } from "./BlockEditor";
import { Check, Field, ListEditor, Select } from "./Fields";
import { cmsRequest, MediaDialog, MediaLibrary } from "./MediaLibrary";
import { SettingsEditor } from "./SettingsEditor";

type Tab = "pages" | "settings" | "announcements" | "media" | "history";
type Version = { id: string; reason: string; createdAt: string };
const date = (value: string) => new Date(value).toLocaleString("fr-FR");

function PagePathEditor({ value, rename }: { value: string; rename: (value: string) => void }) {
  const [next, setNext] = useState(value);
  const [error, setError] = useState("");
  return <div className="space-y-2">
    <Field label="Adresse de la page" value={next} onChange={setNext} maxLength={200}
      hint="Exemple : /cabinet/acces. Appliquez le changement ci-dessous. L’ancienne adresse sera redirigée après publication." />
    <button type="button" className="cms-action" disabled={next === value} onClick={() => {
      const result = pathSchema.safeParse(next);
      if (!result.success) { setError(result.error.issues[0]?.message || "Adresse invalide."); return; }
      setError(""); rename(result.data);
    }}>Appliquer la nouvelle adresse</button>
    {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
  </div>;
}

export function Editor({ initialState, originalMedia, uploadedMedia, uploadsEnabled }: {
  initialState: CmsState; originalMedia: Media[]; uploadedMedia: Media[]; uploadsEnabled: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [document, setDocument] = useState(initialState.draft);
  const [tab, setTab] = useState<Tab>("pages");
  const [pageId, setPageId] = useState(initialState.draft.pages[0]?.id || "");
  const [media, setMedia] = useState([...uploadedMedia, ...originalMedia]);
  const [selection, setSelection] = useState<{ choose: (image: CmsImage) => void } | null>(null);
  const [blockType, setBlockType] = useState<Block["type"]>("text");
  const [versions, setVersions] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const past = useRef<CmsDocument[]>([]);
  const future = useRef<CmsDocument[]>([]);
  const dirty = useMemo(() => JSON.stringify(document) !== JSON.stringify(state.draft), [document, state.draft]);
  const page = document.pages.find((p) => p.id === pageId);
  const chooseImage = (choose: (image: CmsImage) => void) => setSelection({ choose });
  function change(next: CmsDocument) {
    past.current = [...past.current.slice(-29), document];
    future.current = [];
    setDocument(next); setMessage("");
  }
  function updatePage(next: CmsPage) {
    change({ ...document, pages: document.pages.map((item) => item.id === next.id ? next : item) });
  }
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) { if (dirty) { event.preventDefault(); event.returnValue = ""; } }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  useEffect(() => {
    if (tab !== "history") return;
    let active = true;
    cmsRequest<Version[]>("/api/admin/versions").then((result) => { if (active) setVersions(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Historique indisponible."); });
    return () => { active = false; };
  }, [tab, state.revision]);

  async function save(publish: boolean) {
    if (publish && !window.confirm("Publier toutes les pages, les réglages et les annonces de ce brouillon sur le site public ?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const parsed = documentSchema.safeParse(document);
      if (!parsed.success) throw new Error(parsed.error.issues.map((issue) => {
        const [section, pageIndex, collection, blockIndex] = issue.path;
        const page = section === "pages" && typeof pageIndex === "number" ? document.pages[pageIndex] : undefined;
        const context = page
          ? `Page « ${page.title} »${collection === "blocks" && typeof blockIndex === "number" ? `, bloc ${blockIndex + 1}` : ""}`
          : section === "settings" ? "Réglages du site" : "Contenu";
        return `${context} : ${issue.message}`;
      }).join("\n"));
      const next = await cmsRequest<CmsState>("/api/admin/content", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: parsed.data, revision: state.revision, publish }),
      });
      setState(next); setDocument(next.draft);
      setMessage(publish ? "Publication confirmée. Le site public affiche désormais cette version." : "Brouillon enregistré. Le site public n’a pas changé.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }
  function exportDocument() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(document, null, 2)], { type: "application/json" }));
    const a = window.document.createElement("a");
    a.href = url; a.download = `contenu-cabinet-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function addPage() {
    let suffix = document.pages.length + 1;
    while (document.pages.some((p) => p.path === `/nouvelle-page-${suffix}`)) suffix++;
    const id = crypto.randomUUID();
    const block = { ...newBlock("text"), title: "Nouvelle page" };
    change({ ...document, pages: [...document.pages, { id, path: `/nouvelle-page-${suffix}`, title: "Nouvelle page", description: "", ogImage: "", noindex: false, blocks: [block] }] });
    setPageId(id);
  }
  return <div className="min-h-screen">
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3">
        <p className="mr-auto font-serif text-xl">Mini CMS · {document.settings.name}</p>
        <Link href="/" target="_blank" className="cms-action">Voir le site public</Link>
        <button type="button" className="cms-action" disabled={busy || !past.current.length} onClick={() => {
          const previous = past.current.pop();
          if (previous) { future.current.push(document); setDocument(previous); }
        }}>Annuler</button>
        <button type="button" className="cms-action" disabled={busy || !future.current.length} onClick={() => {
          const next = future.current.pop();
          if (next) { past.current.push(document); setDocument(next); }
        }}>Rétablir</button>
        <button type="button" className="cms-action" disabled={busy || !dirty} onClick={() => save(false)}>Enregistrer le brouillon</button>
        <button type="button" className="btn-primary !py-2" disabled={busy} onClick={() => save(true)}>{busy ? "Traitement…" : "Publier tout"}</button>
        <button type="button" className="cms-action" disabled={busy} onClick={async () => {
          if (dirty && !window.confirm("Des modifications ne sont pas enregistrées. Vous déconnecter et les abandonner ?")) return;
          try { await cmsRequest("/api/admin/logout", { method: "POST" }); window.location.assign("/admin"); }
          catch (cause) { setError(cause instanceof Error ? cause.message : "Déconnexion impossible."); }
        }}>Déconnexion</button>
      </div>
      <p className="mx-auto mt-3 max-w-[1600px] text-xs text-muted" role="status" aria-live="polite">
        {dirty ? "Modifications non enregistrées" : `Brouillon enregistré le ${date(state.updatedAt)}`} · Dernière publication : {date(state.publishedAt)}
      </p>
    </header>
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
      <nav aria-label="Administration" className="mb-6 flex flex-wrap gap-2">
        {([
          ["pages", "Pages"], ["settings", "Réglages du site"], ["announcements", "Annonces sur tout le site"],
          ["media", "Médiathèque"], ["history", "Historique et sauvegarde"],
        ] as const).map(([value, label]) => <button key={value} type="button" className={`cms-action ${tab === value ? "border-accent text-accent" : ""}`}
          aria-current={tab === value ? "page" : undefined} onClick={() => setTab(value)}>{label}</button>)}
      </nav>
      {message && <p role="status" className="cms-panel mb-6 text-accent">{message}</p>}
      {error && <div role="alert" className="cms-panel mb-6 space-y-3 border-red-400">
        <p className="whitespace-pre-wrap break-words text-sm text-red-300">{error}</p>
        <div className="flex flex-wrap gap-3"><button type="button" className="cms-action" onClick={exportDocument}>Exporter mes modifications</button><Link href="/admin" target="_blank" className="cms-action">Connexion dans un autre onglet</Link></div>
      </div>}
      <fieldset disabled={busy} className="min-w-0">
        {tab === "pages" && <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="cms-panel space-y-3">
            <h1 className="text-2xl">Pages</h1>
            <p className="text-xs text-muted">Les nouvelles pages deviennent accessibles après publication. Ajoutez-les ensuite au menu dans les réglages.</p>
            <ul className="space-y-1">{document.pages.map((item) => <li key={item.id}><button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm ${page?.id === item.id ? "bg-background text-accent" : ""}`} onClick={() => setPageId(item.id)}>{item.title}<span className="mt-1 block break-all text-xs text-muted">{item.path}</span></button></li>)}</ul>
            <button type="button" className="cms-action w-full" disabled={document.pages.length >= 100} onClick={addPage}>+ Créer une page</button>
          </aside>
          {page && <div key={page.id} className="min-w-0 space-y-6">
            <section className="cms-panel space-y-4">
              <div className="flex flex-wrap items-center gap-3"><h2 className="mr-auto text-2xl">{page.title}</h2>
                <a className={`cms-action ${dirty ? "opacity-40" : ""}`} href={`/preview/${page.id}`} target="_blank" rel="noopener noreferrer" aria-disabled={dirty} onClick={(e) => { if (dirty) { e.preventDefault(); setError("Enregistrez le brouillon avant de le prévisualiser."); } }}>Prévisualiser le brouillon</a>
                <button type="button" className="cms-action" disabled={document.pages.length >= 100} onClick={() => {
                  const copy: CmsPage = { ...page, id: crypto.randomUUID(), path: `${page.path === "/" ? "/accueil" : page.path}-copie-${crypto.randomUUID().slice(0, 6)}`, title: `${page.title} (copie)`, blocks: page.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })) };
                  change({ ...document, pages: [...document.pages, copy] }); setPageId(copy.id);
                }}>Dupliquer la page</button>
                <button type="button" className="cms-action text-red-300" disabled={page.path === "/"} onClick={() => {
                  if (!window.confirm("Supprimer cette page du brouillon ? Retirez aussi ses liens dans les menus et les contenus avant de publier. L’historique conserve les versions enregistrées.")) return;
                  change({ ...document, pages: document.pages.filter((p) => p.id !== page.id), redirects: document.redirects.filter((r) => r.pageId !== page.id) }); setPageId(document.pages.find((p) => p.id !== page.id)?.id || "");
                }}>Supprimer</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titre de la page / référencement" value={page.title} onChange={(title) => updatePage({ ...page, title })} maxLength={300} />
                {page.path === "/" ? <p className="self-center text-sm text-muted">Accueil : le chemin / est fixe.</p> : <PagePathEditor key={`${page.id}:${page.path}`} value={page.path} rename={(value) => {
                  if (document.pages.some((p) => p.id !== page.id && p.path === value)) { setError("Cette adresse est déjà utilisée par une autre page."); return; }
                  change(renamePage(document, page.id, value));
                }} />}
              </div>
              <Field label="Description pour les moteurs de recherche" value={page.description} onChange={(description) => updatePage({ ...page, description })} maxLength={1000} />
              <Check label="Ne pas indexer cette page dans les moteurs de recherche" value={page.noindex} onChange={(noindex) => updatePage({ ...page, noindex })} />
              <div className="flex flex-wrap items-center gap-3"><button type="button" className="cms-action" onClick={() => chooseImage((image) => updatePage({ ...page, ogImage: image.src }))}>Choisir l’image de partage</button>
                {page.ogImage && <><span className="max-w-lg truncate text-xs text-muted">{page.ogImage}</span><button type="button" className="cms-action" onClick={() => updatePage({ ...page, ogImage: "" })}>Retirer</button></>}
              </div>
            </section>
            <section className="cms-panel">
              <h2 className="mb-4 text-2xl">Contenu de la page</h2>
              <ListEditor label="Blocs" items={page.blocks} onChange={(blocks) => updatePage({ ...page, blocks })} max={80} create={() => newBlock(blockType)}
                render={(block, update, index) => <details open={page.blocks.length === 1}>
                  <summary className="cursor-pointer text-base font-medium">{index + 1}. {blockLabels[block.type]} — {block.title || "Sans titre"}{!block.visible && " (masqué)"}</summary>
                  <div className="mt-5 space-y-4"><button type="button" className="cms-action" disabled={page.blocks.length >= 80} onClick={() => updatePage({ ...page, blocks: [...page.blocks.slice(0, index + 1), { ...block, id: crypto.randomUUID() }, ...page.blocks.slice(index + 1)] })}>Dupliquer le bloc</button>
                    <BlockEditor block={block} onChange={update} chooseImage={chooseImage} />
                  </div>
                </details>} />
              <div className="mt-5 max-w-md"><Select label="Type du prochain bloc ajouté" value={blockType} onChange={setBlockType} options={blockTypes.map((value) => ({ value, label: blockLabels[value] }))} /></div>
            </section>
          </div>}
        </div>}
        {tab === "settings" && <SettingsEditor settings={document.settings} onChange={(settings) => change({ ...document, settings })} chooseImage={chooseImage} />}
        {tab === "announcements" && <section className="cms-panel space-y-5">
          <h1 className="text-3xl">Annonces sur tout le site</h1>
          <p className="text-sm text-muted">Affichées sous le menu, sur toutes les pages. Pour une annonce sur une seule page, ajoutez un bloc « Annonce » dans cette page. Texte long, liens, photos, dates et largeur se règlent ci-dessous.</p>
          <ListEditor<Block> label="Annonces" items={document.settings.announcements} onChange={(announcements) => change({ ...document, settings: { ...document.settings, announcements } })} max={20} create={() => ({ ...newBlock("announcement"), title: "Information du cabinet", background: "accent" })}
            render={(block, update) => <BlockEditor block={block} onChange={update} chooseImage={chooseImage} fixedType />} />
        </section>}
        {tab === "media" && <section className="cms-panel space-y-6"><h1 className="text-3xl">Médiathèque</h1><MediaLibrary media={media} onMediaChange={setMedia} uploadsEnabled={uploadsEnabled} /></section>}
        {tab === "history" && <section className="cms-panel space-y-6">
          <h1 className="text-3xl">Historique et sauvegarde</h1>
          <p className="text-sm text-muted">Les 30 versions précédant les derniers enregistrements sont conservées. Restaurer crée un brouillon ; cela ne modifie jamais directement le site public. Les fichiers image restent disponibles pour les anciennes versions.</p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="cms-action" onClick={exportDocument}>Exporter les contenus en JSON</button>
            <label className="cms-label">Importer une sauvegarde dans le brouillon<input className="cms-field" type="file" accept="application/json,.json" onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setError("");
              if (file.size > 2 * 1024 * 1024) { setError("Sauvegarde trop volumineuse (2 Mo maximum)."); return; }
              if (!window.confirm("Remplacer le brouillon local par cette sauvegarde ? Le site public restera inchangé jusqu’à publication.")) return;
              try {
                const parsed = documentSchema.parse(JSON.parse(await file.text()));
                change(parsed); setPageId(parsed.pages[0]?.id || ""); setMessage("Sauvegarde chargée. Vérifiez-la, puis enregistrez le brouillon.");
              } catch (cause) { setError(cause instanceof Error ? `Sauvegarde invalide : ${cause.message}` : "Sauvegarde invalide."); }
            }} /></label>
          </div>
          <ul className="space-y-3">{versions.map((version) => <li key={version.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
            <p>{date(version.createdAt)} <span className="text-sm text-muted">· {version.reason}</span></p>
            <button type="button" className="cms-action" onClick={async () => {
              if (!window.confirm("Restaurer cette version dans le brouillon enregistré ? Les modifications locales non enregistrées seront remplacées ; le site public ne changera pas.")) return;
              setBusy(true); setError("");
              try {
                const next = await cmsRequest<CmsState>("/api/admin/versions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: version.id, revision: state.revision }) });
                setState(next); setDocument(next.draft); past.current = []; future.current = [];
                setPageId(next.draft.pages[0]?.id || ""); setMessage("Version restaurée dans le brouillon. Prévisualisez avant de publier.");
              } catch (cause) { setError(cause instanceof Error ? cause.message : "Restauration impossible."); }
              finally { setBusy(false); }
            }}>Restaurer dans le brouillon</button>
          </li>)}</ul>
          {!versions.length && <p className="text-sm text-muted">Aucune version enregistrée pour le moment.</p>}
        </section>}
      </fieldset>
    </div>
    {selection && <MediaDialog media={media} onMediaChange={setMedia} select={selection.choose} close={() => setSelection(null)} uploadsEnabled={uploadsEnabled} />}
  </div>;
}
