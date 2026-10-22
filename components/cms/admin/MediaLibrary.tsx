"use client";

import { useEffect, useRef, useState } from "react";
import type { CmsImage, Media } from "@/lib/cms/schema";
import { Field, Select } from "./Fields";

export async function cmsRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new Error("Le serveur a renvoyé une réponse illisible. Réessayez sans fermer cette fenêtre."); }
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "message" in result && typeof result.message === "string"
      ? result.message : `Erreur HTTP ${response.status}.`;
    throw new Error(message);
  }
  return result as T;
}
function FilePreview({ file }: { file: File }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url); setFailed(false);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <figure className="space-y-2">
    {src && !failed && (
      // A local object URL previews the file before any upload.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`Aperçu avant import : ${file.name}`} onError={() => setFailed(true)}
        className="max-h-64 w-full rounded-lg border border-border bg-background object-contain" />
    )}
    {failed && <p role="alert" className="text-sm text-red-300">Impossible d’afficher l’aperçu. Vérifiez que le fichier est une image JPEG, PNG ou WebP valide.</p>}
    <figcaption className="break-words text-sm text-muted">{file.name} · {(file.size / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} Mo</figcaption>
  </figure>;
}

type MediaChange = (items: Media[], revision?: { previousRevision: number; revision: number }) => void;
export function MediaLibrary({ media, onMediaChange, choose, uploadsEnabled, isImageUsed }: {
  media: Media[]; onMediaChange: MediaChange; choose?: (image: CmsImage) => void; uploadsEnabled: boolean;
  isImageUsed?: (src: string) => boolean;
}) {
  const [search, setSearch] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!file) { setError("Choisissez une image avant de lancer l’import."); return; }
    if (!alt.trim()) { setError("Ajoutez une description de l’image pour l’accessibilité avant de lancer l’import."); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisissez une image au format JPEG, PNG ou WebP."); return;
    }
    if (!file.size || file.size > 3 * 1024 * 1024) {
      setError("Choisissez une image non vide de 3 Mo maximum."); return;
    }
    setBusy(true);
    setError("");
    const form = event.currentTarget;
    try {
      const data = new FormData(form);
      const item = await cmsRequest<Media>("/api/admin/media", { method: "POST", body: data });
      onMediaChange([item, ...media]);
      setAlt("");
      setFile(null);
      formRef.current?.reset();
      setMessage("Image importée avec succès. Elle est maintenant disponible dans la médiathèque.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Échec de l'import."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <p className="text-sm text-muted">Images publiques uniquement. Ne déposez pas de dossiers patients ni de documents confidentiels. Pour des photos cliniques, vérifiez les autorisations de publication.</p>
    {uploadsEnabled ? <form ref={formRef} onSubmit={upload} noValidate className="cms-panel space-y-4">
      <label className="cms-label">Nouvelle image (JPEG, PNG ou WebP ; 3 Mo et 25 mégapixels maximum)
        <input className="cms-field" type="file" name="file" accept="image/jpeg,image/png,image/webp" required disabled={busy}
          onChange={(event) => { setFile(event.currentTarget.files?.[0] ?? null); setError(""); setMessage(""); }} />
      </label>
      {file && <div className="space-y-3">
        <FilePreview key={`${file.name}:${file.lastModified}`} file={file} />
        <button type="button" className="cms-action" disabled={busy} onClick={() => {
          const input = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
          if (input) input.value = "";
          setFile(null);
        }}>Retirer l’image sélectionnée</button>
      </div>}
      <Field label="Description de l'image pour l'accessibilité (obligatoire)" value={alt} onChange={setAlt} maxLength={500}
        hint="Décrivez brièvement ce que montre la photo, par exemple : Salle de soin du cabinet." />
      <input type="hidden" name="alt" value={alt} />
      <button type="submit" disabled={busy} className="btn-primary">{busy ? "Import en cours…" : "Importer l'image"}</button>
      <p className="text-xs text-muted">Conversion WebP, suppression des métadonnées et redimensionnement automatique à 2 400 pixels maximum.</p>
    </form> : <p className="cms-panel text-sm" role="status">L’import nécessite BLOB_READ_WRITE_TOKEN sur Vercel. Les images existantes restent disponibles.</p>}
    {error && <p role="alert" className="whitespace-pre-wrap text-sm text-red-300">{error}</p>}
    {message && <p role="status" className="text-sm text-accent">{message}</p>}
    <Field label="Rechercher une image" value={search} onChange={setSearch} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {media.filter((item) => `${item.name} ${item.alt}`.toLowerCase().includes(search.toLowerCase())).map((image) => <article className="min-w-0 rounded-xl border border-border p-3" key={image.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} loading="lazy" className="aspect-[4/3] w-full rounded-lg bg-background object-contain" />
        <p className="mt-3 break-words text-sm">{image.name}</p><p className="mt-1 text-xs text-muted">{image.alt}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {choose && <button type="button" className="cms-action" onClick={() => choose({ src: image.src, alt: image.alt, caption: image.caption, fit: image.fit, position: image.position, ratio: image.ratio })}>Choisir cette image</button>}
          {!image.id.startsWith("original-") && <button type="button" disabled={busy || !uploadsEnabled} className="cms-action text-red-300" onClick={async () => {
            if (isImageUsed?.(image.src)) {
              setError("Cette image est utilisée dans vos modifications actuelles. Retirez-la des pages et des réglages avant de la supprimer.");
              return;
            }
            if (!window.confirm(`Supprimer définitivement « ${image.name} » de la médiathèque et du stockage ? Cette action est irréversible et sera refusée si l’image est utilisée dans le brouillon, le site publié ou l’historique.`)) return;
            setBusy(true); setError("");
            try {
              const revision = await cmsRequest<{ previousRevision: number; revision: number }>("/api/admin/media", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: image.id }) });
              onMediaChange(media.filter((item) => item.id !== image.id), revision);
            }
            catch (cause) { setError(cause instanceof Error ? cause.message : "Échec de la suppression."); }
            finally { setBusy(false); }
          }}>Supprimer définitivement</button>}
        </div>
        {image.id.startsWith("original-") && <p className="mt-3 text-xs text-muted">Image d’origine du projet : suppression du fichier indisponible dans le CMS.</p>}
        {!image.id.startsWith("original-") && !uploadsEnabled && <p className="mt-3 text-xs text-muted">La suppression du fichier nécessite la connexion au stockage Vercel Blob.</p>}
      </article>)}
    </div>
    {!media.length && <p>Aucune image pour le moment.</p>}
  </div>;
}

export function ImageEditor({ image, onChange, onChoose }: {
  image: CmsImage; onChange: (image: CmsImage) => void; onChoose: (callback: (image: CmsImage) => void) => void;
}) {
  return <div className="space-y-4">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={image.src} alt={image.alt} loading="lazy" className="h-36 w-full rounded-lg bg-surface object-contain" />
    <button type="button" className="cms-action" onClick={() => onChoose((next) => onChange({ ...image, src: next.src, alt: next.alt }))}>Remplacer depuis la médiathèque</button>
    <Field label="Description de l'image (obligatoire)" value={image.alt} onChange={(alt) => onChange({ ...image, alt })} maxLength={500} />
    <Field label="Légende visible (facultative)" value={image.caption} onChange={(caption) => onChange({ ...image, caption })} maxLength={1000} />
    <div className="grid gap-4 sm:grid-cols-3">
      <Select label="Format" value={image.ratio} onChange={(ratio) => onChange({ ...image, ratio })} options={[
        { value: "auto", label: "Proportions originales" }, { value: "landscape", label: "Paysage 4:3" },
        { value: "wide", label: "Panoramique 16:9" }, { value: "square", label: "Carré" }, { value: "portrait", label: "Portrait 3:4" },
      ]} />
      <Select label="Cadrage" value={image.fit} onChange={(fit) => onChange({ ...image, fit })} options={[{ value: "cover", label: "Remplir / recadrer" }, { value: "contain", label: "Voir toute l'image" }]} />
      <Select label="Point d'intérêt" value={image.position} onChange={(position) => onChange({ ...image, position })} options={[
        { value: "center", label: "Centre" }, { value: "top", label: "Haut" }, { value: "bottom", label: "Bas" }, { value: "left", label: "Gauche" }, { value: "right", label: "Droite" },
      ]} />
    </div>
  </div>;
}

export function MediaDialog({ media, onMediaChange, select, close, uploadsEnabled, isImageUsed }: {
  media: Media[]; onMediaChange: MediaChange; select: (image: CmsImage) => void; close: () => void; uploadsEnabled: boolean;
  isImageUsed?: (src: string) => boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} onClose={close} className="max-h-[90vh] w-[min(1100px,95vw)] rounded-2xl border border-border bg-background p-5 text-ink backdrop:bg-black/80 sm:p-8">
    <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-2xl">Choisir une image</h2><button type="button" className="cms-action" onClick={close}>Fermer</button></div>
    <MediaLibrary media={media} onMediaChange={onMediaChange} choose={(image) => { select(image); close(); }} uploadsEnabled={uploadsEnabled} isImageUsed={isImageUsed} />
  </dialog>;
}
