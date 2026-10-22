"use client";

import type { Settings } from "@/lib/cms/schema";
import { Field, ListEditor, TextEditor } from "./Fields";
import { ButtonsEditor, type ChooseImage } from "./BlockEditor";
import { ImageEditor } from "./MediaLibrary";

export function SettingsEditor({ settings, onChange, chooseImage }: {
  settings: Settings; onChange: (settings: Settings) => void; chooseImage: ChooseImage;
}) {
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    onChange({ ...settings, [key]: value });
  }
  return <div className="space-y-6">
    <section className="cms-panel space-y-5">
      <h2 className="text-2xl">Identité et coordonnées</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom court (en-tête et pied de page)" value={settings.name} onChange={(v) => update("name", v)} maxLength={300} />
        <Field label="Nom complet du cabinet" value={settings.practiceName} onChange={(v) => update("practiceName", v)} maxLength={300} />
        <Field label="Sous-titre" value={settings.tagline} onChange={(v) => update("tagline", v)} maxLength={300} />
        <Field label="Domaine public HTTPS" value={settings.url} onChange={(v) => update("url", v)} hint="Sans chemin. Utilisé pour le référencement, pas pour déplacer l’hébergement." />
        <Field label="Téléphone" value={settings.phone} onChange={(v) => update("phone", v)} maxLength={50} />
        <Field type="email" label="E-mail public principal" value={settings.email} onChange={(v) => update("email", v)} maxLength={254} />
        <Field type="email" label="Destinataire des messages du formulaire (non affiché)" value={settings.contactRecipient} onChange={(v) => update("contactRecipient", v)} maxLength={254} />
        <Field type="color" label="Couleur d’accent" value={settings.accent} onChange={(v) => update("accent", v)} />
      </div>
      <Field label="Présentation du cabinet (texte simple pour le pied de page et le référencement)" value={settings.description} onChange={(v) => update("description", v)} maxLength={2000} />
      <ListEditor label="Adresses e-mail publiques supplémentaires" items={settings.additionalEmails} onChange={(v) => update("additionalEmails", v)} max={10} create={() => ""}
        render={(email, set) => <Field type="email" label="Adresse e-mail" value={email} onChange={set} maxLength={254} />} />
      <p className="text-xs text-muted">Variables disponibles dans le contenu des blocs : {"{{practiceName}}, {{name}}, {{tagline}}, {{email}}, {{emails}}, {{phone}}, {{address}}."} Elles suivent automatiquement les coordonnées publiées.</p>
    </section>
    <section className="cms-panel space-y-5">
      <h2 className="text-2xl">Adresse et horaires</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["streetAddress", "Rue et numéro"], ["postalCode", "Code postal"], ["addressLocality", "Ville"],
          ["addressRegion", "Région"], ["addressCountry", "Pays (code à deux lettres)"],
        ] as const).map(([key, label]) => <Field key={key} label={label} value={settings.address[key]} onChange={(v) => update("address", { ...settings.address, [key]: v })} maxLength={key === "addressCountry" ? 2 : 300} />)}
      </div>
      <ListEditor label="Horaires" items={settings.openingHours} onChange={(v) => update("openingHours", v)} max={30} create={() => ({ days: "", hours: "" })}
        render={(slot, set) => <div className="grid gap-4 sm:grid-cols-2"><Field label="Jours" value={slot.days} onChange={(days) => set({ ...slot, days })} maxLength={300} /><Field label="Horaires" value={slot.hours} onChange={(hours) => set({ ...slot, hours })} maxLength={300} /></div>} />
    </section>
    <section className="cms-panel space-y-5">
      <h2 className="text-2xl">Équipe</h2>
      <ListEditor<Settings["team"][number]> label="Praticiens" items={settings.team} onChange={(v) => update("team", v)} max={30}
        create={() => ({ id: crypto.randomUUID(), name: "", title: "Chirurgien-dentiste", bio: "", doctolibUrl: "https://www.doctolib.fr", photo: { src: "/images/Cohen_avi.webp", alt: "Portrait à remplacer", caption: "", fit: "cover", position: "center", ratio: "square" } })}
        render={(member, set) => <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Nom" value={member.name} onChange={(name) => set({ ...member, name })} maxLength={300} /><Field label="Fonction" value={member.title} onChange={(title) => set({ ...member, title })} maxLength={300} /></div>
          <TextEditor label="Présentation" value={member.bio} onChange={(bio) => set({ ...member, bio })} />
          <Field label="Lien de rendez-vous" value={member.doctolibUrl} onChange={(doctolibUrl) => set({ ...member, doctolibUrl })} />
          <ImageEditor image={member.photo} onChange={(photo) => set({ ...member, photo })} onChoose={chooseImage} />
        </div>} />
    </section>
    <section className="cms-panel space-y-5">
      <h2 className="text-2xl">Spécialités mises en avant</h2>
      <p className="text-sm text-muted">Ces cartes pointent vers les pages correspondantes. Les pages elles-mêmes se modifient dans « Pages ».</p>
      <ListEditor label="Spécialités" items={settings.specialties} onChange={(v) => update("specialties", v)} max={30} create={() => ({ id: crypto.randomUUID(), title: "", summary: "", href: "/" })}
        render={(specialty, set) => <div className="space-y-4">
          <Field label="Titre" value={specialty.title} onChange={(title) => set({ ...specialty, title })} maxLength={300} />
          <TextEditor label="Présentation" value={specialty.summary} onChange={(summary) => set({ ...specialty, summary })} />
          <Field label="Lien de la page" value={specialty.href} onChange={(href) => set({ ...specialty, href })} />
        </div>} />
    </section>
    <section className="cms-panel space-y-5">
      <h2 className="text-2xl">Menus et pied de page</h2>
      <ListEditor label="Entrées du menu principal" items={settings.navigation} onChange={(v) => update("navigation", v)} max={30} create={() => ({ label: "Nouvelle page", href: "/", children: [] })}
        render={(item, set) => <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Libellé" value={item.label} onChange={(label) => set({ ...item, label })} maxLength={300} /><Field label="Destination" value={item.href} onChange={(href) => set({ ...item, href })} /></div>
          <ListEditor label="Sous-menu" items={item.children} onChange={(children) => set({ ...item, children })} max={30} create={() => ({ label: "Nouvelle page", href: "/" })}
            render={(child, updateChild) => <div className="grid gap-4 sm:grid-cols-2"><Field label="Libellé" value={child.label} onChange={(label) => updateChild({ ...child, label })} maxLength={300} /><Field label="Destination" value={child.href} onChange={(href) => updateChild({ ...child, href })} /></div>} />
        </div>} />
      <ButtonsEditor buttons={settings.footerLinks} onChange={(v) => update("footerLinks", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Crédit de réalisation : texte" value={settings.credit.label} onChange={(label) => update("credit", { ...settings.credit, label })} maxLength={300} />
        <Field label="Crédit de réalisation : lien" value={settings.credit.href} onChange={(href) => update("credit", { ...settings.credit, href })} />
      </div>
    </section>
  </div>;
}
