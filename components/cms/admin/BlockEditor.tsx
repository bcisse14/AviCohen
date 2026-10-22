"use client";

import { useEffect, useState } from "react";
import { blockLabels, blockTypes, type Block, type CmsImage } from "@/lib/cms/schema";
import { Check, Field, ListEditor, Select, TextEditor } from "./Fields";
import { ImageEditor } from "./MediaLibrary";
import type { PublicationTarget } from "@/lib/cms/publication";

export type ChooseImage = (callback: (image: CmsImage) => void) => void;
export function ButtonsEditor({ buttons, onChange }: { buttons: Block["buttons"]; onChange: (buttons: Block["buttons"]) => void }) {
  return <ListEditor label="Boutons" items={buttons} onChange={onChange} max={10} create={() => ({ label: "En savoir plus", href: "/contact" })} render={(button, update) =>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Libellé" value={button.label} onChange={(label) => update({ ...button, label })} maxLength={300} />
      <Field label="Destination" value={button.href} onChange={(href) => update({ ...button, href })} hint="/une-page, https://…, mailto:… ou tel:…" />
    </div>} />;
}
function dateInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function BlockEditor({ block, onChange, chooseImage, fixedType = false, publication }: {
  block: Block; onChange: (block: Block) => void; chooseImage: ChooseImage; fixedType?: boolean;
  publication?: { busy: boolean; dirty: boolean; save: (publish: boolean | PublicationTarget) => Promise<void>; target: PublicationTarget };
}) {
  const [timeZone, setTimeZone] = useState("");
  useEffect(() => { setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone); }, []);
  const hasImages = ["split", "image", "gallery", "announcement"].includes(block.type);
  return <div className="min-w-0 space-y-5">
    {block.type === "announcement" && <p className="rounded-xl border border-border p-4 text-sm text-muted">
      Cette annonce s’ouvre dans une fenêtre au premier plan, avec un seul bouton Fermer toujours accessible, la touche Échap et le clic sur le fond.
      Les annonces s’affichent une par une. Sa fermeture est mémorisée dans cet onglet pendant la visite.
      Une modification de l’annonce permet de l’afficher à nouveau. La prévisualisation utilise une mémoire distincte du site public.
    </p>}
    <div className="grid gap-4 sm:grid-cols-2">
      {!fixedType && <Select label="Type de bloc" value={block.type} onChange={(type) => onChange({ ...block, type })} options={blockTypes.map((value) => ({ value, label: blockLabels[value] }))} />}
      <Field label="Petit titre au-dessus (facultatif)" value={block.eyebrow} onChange={(eyebrow) => onChange({ ...block, eyebrow })} maxLength={300} />
    </div>
    <Field label="Titre" value={block.title} onChange={(title) => onChange({ ...block, title })} maxLength={300} />
    <TextEditor label="Contenu" value={block.body} onChange={(body) => onChange({ ...block, body })} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Select label="Largeur" value={block.width} onChange={(width) => onChange({ ...block, width })} options={[
        { value: "compact", label: "Étroite" }, { value: "standard", label: "Standard" }, { value: "wide", label: "Large" }, { value: "full", label: "Toute la largeur" },
      ]} />
      <Select label="Fond" value={block.background} onChange={(background) => onChange({ ...block, background })} options={[
        { value: "default", label: "Fond du site" }, { value: "surface", label: "Fond contrasté" }, { value: "accent", label: "Fond mis en valeur" },
      ]} />
      <Select label="Alignement du texte" value={block.align} onChange={(align) => onChange({ ...block, align })} options={[{ value: "left", label: "À gauche" }, { value: "center", label: "Centré" }]} />
      {["gallery", "cards", "team", "specialties", "announcement"].includes(block.type) && <Select label="Colonnes sur grand écran" value={String(block.columns)} onChange={(value) => onChange({ ...block, columns: Number(value) })} options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }))} />}
      {block.type === "split" && <Select label="Position des photos sur grand écran" value={block.imageSide} onChange={(imageSide) => onChange({ ...block, imageSide })} options={[{ value: "left", label: "Photos à gauche" }, { value: "right", label: "Photos à droite" }]} />}
    </div>
    <Check label="Bloc visible" value={block.visible} onChange={(visible) => onChange({ ...block, visible })} />
    <details className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-sm">Programmation de l’affichage (facultative)</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field type="datetime-local" label="Début" value={timeZone ? dateInput(block.startsAt) : ""} onChange={(value) => onChange({ ...block, startsAt: value ? new Date(value).toISOString() : "" })} />
        <Field type="datetime-local" label="Fin" value={timeZone ? dateInput(block.endsAt) : ""} onChange={(value) => onChange({ ...block, endsAt: value ? new Date(value).toISOString() : "" })} />
      </div><p className="mt-3 text-xs text-muted">Heure locale de votre navigateur ({timeZone || "détection en cours"}). Après publication, l’affichage est calculé à chaque visite, sans redéploiement.</p>
    </details>
    {hasImages && <div className="space-y-4">
      <ListEditor<CmsImage> label="Images" items={block.images} onChange={(images) => onChange({ ...block, images })}
        create={() => ({ src: "/images/cabinet-salle-soin-01.jpg", alt: "Salle de soin du cabinet", caption: "", fit: "cover", position: "center", ratio: "landscape" })}
        render={(image, update) => <ImageEditor image={image} onChange={update} onChoose={chooseImage} />} />
      <button type="button" className="cms-action" disabled={block.images.length >= 100} onClick={() => chooseImage((image) => onChange({ ...block, images: [...block.images, image] }))}>+ Choisir une image dans la médiathèque</button>
    </div>}
    {["faq", "cards", "split"].includes(block.type) && <ListEditor label={block.type === "faq" ? "Questions / réponses" : block.type === "split" ? "Détails repliables" : "Cartes"} items={block.items} onChange={(items) => onChange({ ...block, items })}
      create={() => ({ title: "", body: "" })} render={(item, update) => <div className="space-y-4">
        <Field label={block.type === "faq" ? "Question" : "Titre"} value={item.title} onChange={(title) => update({ ...item, title })} maxLength={300} />
        <TextEditor label={block.type === "faq" ? "Réponse" : "Texte"} value={item.body} onChange={(body) => update({ ...item, body })} />
      </div>} />}
    {["team", "specialties", "details", "contact"].includes(block.type) && <p className="rounded-xl border border-border p-4 text-sm text-muted">Les informations de ce bloc sont partagées sur le site. Modifiez-les dans « Réglages du site » ; le formulaire de contact conserve ses validations et son service d’envoi.</p>}
    <ButtonsEditor buttons={block.buttons} onChange={(buttons) => onChange({ ...block, buttons })} />
    <Check label="Afficher aussi les liens de rendez-vous de l'équipe (synchronisés avec les réglages)" value={block.showAppointments} onChange={(showAppointments) => onChange({ ...block, showAppointments })} />
    <p className="text-xs text-muted">Sur mobile, les colonnes passent automatiquement en une seule colonne. La hauteur n’est pas limitée.</p>
    {publication && <section aria-label={block.type === "announcement" ? "Publication de l’annonce" : "Publication du bloc"} className="rounded-xl border border-accent p-4 space-y-3">
      <h3 className="text-xl">{block.type === "announcement" ? "Mettre l’annonce en ligne" : "Mettre le bloc en ligne"}</h3>
      <p className="text-sm text-muted">La publication individuelle met uniquement cet élément en ligne. Les autres modifications sont enregistrées en brouillon, sans être publiées. Les coordonnées et contenus partagés utilisent les réglages déjà en ligne.</p>
      {!block.visible && <p className="text-sm text-accent">{block.type === "announcement" ? "Cette annonce est masquée." : "Ce bloc est masqué."} Cochez « Bloc visible » pour permettre son affichage après publication.</p>}
      {(block.startsAt || block.endsAt) && <p className="text-sm text-muted">Les dates de programmation restent prioritaires : cet élément ne s’affichera que pendant la période définie.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="cms-action" disabled={publication.busy || !publication.dirty} onClick={() => publication.save(false)}>Enregistrer le brouillon</button>
        <button type="button" className="btn-primary" disabled={publication.busy} onClick={() => publication.save(publication.target)}>{publication.busy ? "Traitement…" : block.type === "announcement" ? "Publier uniquement cette annonce" : "Publier uniquement ce bloc"}</button>
      </div>
    </section>}
  </div>;
}
