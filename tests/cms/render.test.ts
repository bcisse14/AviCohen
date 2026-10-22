import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Blocks, ContentBlock, RichText } from "../../components/cms/Blocks";
import { StructuredData } from "../../components/StructuredData";
import { initialDocument } from "../../lib/cms/seed";
import { newBlock } from "../../lib/cms/schema";
import { Header } from "../../components/Header";
import { PublicShell } from "../../components/cms/PublicShell";
import { announcementKey } from "../../lib/cms/announcement";
import { Figure } from "../../components/Figure";
import { Login } from "../../components/cms/admin/Login";
import { BlockEditor } from "../../components/cms/admin/BlockEditor";
import type { PublicationTarget } from "../../lib/cms/publication";
import { Editor } from "../../components/cms/admin/Editor";
import { ListEditor } from "../../components/cms/admin/Fields";
import { ImageEditor, MediaLibrary } from "../../components/cms/admin/MediaLibrary";

// The tsx runner follows the repository's preserved JSX mode.
Object.assign(globalThis, { React });

test("les images sélectionnées sont visibles et les prérequis d’import sont explicites", () => {
  const image = { src: "/images/cabinet-salle-soin-01.jpg", alt: "Salle de soin", caption: "", fit: "contain" as const, position: "center" as const, ratio: "landscape" as const };
  const html = renderToStaticMarkup(React.createElement(ImageEditor, { image, onChange: () => {}, onChoose: () => {} }));
  assert.ok(html.includes(`src="${image.src}"`));
  assert.ok(html.includes('alt="Salle de soin"'));
  const library = renderToStaticMarkup(React.createElement(MediaLibrary, { media: [], onMediaChange: () => {}, uploadsEnabled: true }));
  assert.match(library, /<button type="submit" class="btn-primary">Importer l&#x27;image<\/button>/);
  assert.ok(library.includes("accessibilité (obligatoire)"));
  assert.ok(library.includes("Décrivez brièvement ce que montre la photo"));
  const draft = structuredClone(initialDocument);
  draft.pages[0]!.ogImage = image.src;
  const editor = renderToStaticMarkup(React.createElement(Editor, {
    initialState: { draft, revision: 1, updatedAt: "2026-10-22T10:00:00Z", publishedAt: "2026-10-22T10:00:00Z" },
    originalMedia: [], uploadedMedia: [], uploadsEnabled: false,
  }));
  assert.ok(editor.includes('alt="Aperçu de l’image de partage : Accueil"'));
});

test("la médiathèque propose une suppression définitive uniquement pour les fichiers importés", () => {
  const base = { src: "https://test.public.blob.vercel-storage.com/test.webp", alt: "Photo", caption: "", fit: "contain" as const, position: "center" as const, ratio: "landscape" as const, name: "test.webp", width: 100, height: 100, uploadedAt: "" };
  const html = renderToStaticMarkup(React.createElement(MediaLibrary, {
    media: [{ ...base, id: "imported" }, { ...base, id: "original-1", src: "/images/cabinet-salle-soin-01.jpg" }],
    onMediaChange: () => {}, uploadsEnabled: true,
  }));
  assert.equal((html.match(/>Supprimer définitivement<\/button>/g) || []).length, 1);
  assert.ok(html.includes("suppression du fichier indisponible dans le CMS"));
});

test("le retrait des annonces est explicitement distingué du retrait des blocs ordinaires", () => {
  const draft = structuredClone(initialDocument);
  draft.pages[0]!.blocks.push({ ...newBlock("announcement"), title: "À retirer" });
  const html = renderToStaticMarkup(React.createElement(Editor, {
    initialState: { draft, revision: 1, updatedAt: "2026-10-22T10:00:00Z", publishedAt: "2026-10-22T10:00:00Z" },
    originalMedia: [], uploadedMedia: [], uploadsEnabled: false,
  }));
  assert.ok(html.includes("Retirer l’annonce du site"));
  const generic = renderToStaticMarkup(React.createElement(ListEditor<string>, {
    label: "Exemple", items: ["contenu"], onChange: () => {}, create: () => "", render: (item) => item,
  }));
  assert.ok(generic.includes(">Retirer</button>"));
});

test("les annonces disposent de commandes de publication explicites et signalent leur visibilité", () => {
  const block = { ...newBlock("announcement"), visible: false, startsAt: "2030-01-01T10:00:00.000Z" };
  const props = {
    block, onChange: () => {}, chooseImage: () => {},
    publication: { busy: false, dirty: true, save: async () => {}, target: { type: "announcement", id: block.id } satisfies PublicationTarget },
  };
  for (const fixedType of [true, false]) {
    const html = renderToStaticMarkup(React.createElement(BlockEditor, { ...props, fixedType }));
    assert.ok(html.includes('aria-label="Publication de l’annonce"'));
    assert.ok(html.includes("Publier uniquement cette annonce"));
    assert.ok(html.includes("Enregistrer le brouillon"));
    assert.ok(html.includes("Les autres modifications sont enregistrées en brouillon, sans être publiées"));
    assert.ok(html.includes("Cette annonce est masquée"));
    assert.ok(html.includes("Les dates de programmation restent prioritaires"));
    assert.ok(!html.includes("disabled="));
  }
  const busy = renderToStaticMarkup(React.createElement(BlockEditor, {
    ...props, publication: { ...props.publication, busy: true },
  }));
  assert.match(busy, /<button[^>]*disabled=""[^>]*>Traitement…<\/button>/);
  const ordinary = renderToStaticMarkup(React.createElement(BlockEditor, {
    ...props, block: newBlock("text"), publication: { ...props.publication, target: { type: "block", pageId: "page", id: "block" } },
  }));
  assert.ok(ordinary.includes('aria-label="Publication du bloc"'));
  assert.ok(ordinary.includes("Publier uniquement ce bloc"));
});

test("le formulaire de connexion accepte un identifiant sans imposer une adresse e-mail", () => {
  const html = renderToStaticMarkup(React.createElement(Login));
  assert.ok(html.includes('name="identifier"'));
  assert.ok(html.includes('type="text"'));
  assert.ok(html.includes('autoComplete="username"'));
  assert.ok(!html.includes('type="email"'));
});

test("les annonces longues restent complètes dans une fenêtre défilante avec une seule fermeture", () => {
  const body = "Annonce du cabinet. ".repeat(1200);
  const html = renderToStaticMarkup(React.createElement(ContentBlock, {
    block: { ...newBlock("announcement"), width: "full", body, title: "Informations" },
    settings: initialDocument.settings,
  }));
  assert.ok(html.includes("max-w-none"));
  assert.ok(html.includes(body.trim()));
  assert.ok(!html.includes("line-clamp"));
  assert.ok(html.includes("overflow-y-auto"));
  assert.ok(html.includes("<dialog"));
  assert.ok(html.includes('aria-modal="true"'));
  assert.ok(html.includes('aria-labelledby="'));
  assert.ok(!html.includes('open=""'));
  const narrow = renderToStaticMarkup(React.createElement(ContentBlock, {
    block: { ...newBlock("announcement"), width: "compact", body: "Court" },
    settings: initialDocument.settings,
  }));
  assert.ok(narrow.includes("max-w-3xl"));
  assert.equal((html.match(/aria-label="Fermer l’annonce/g) || []).length, 1);
});

test("toutes les annonces, locales et globales, sont fermables sans rendre les pages ordinaires masquables", () => {
  const settings = structuredClone(initialDocument.settings);
  const announcement = { ...newBlock("announcement"), title: "Information du cabinet" };
  settings.announcements = [announcement];
  const global = renderToStaticMarkup(React.createElement(PublicShell, { settings, children: "Contenu principal" }));
  assert.ok(global.includes("<dialog"));
  assert.ok(global.includes('aria-label="Fermer l’annonce : Information du cabinet"'));
  const local = renderToStaticMarkup(React.createElement(Blocks, { settings, scope: "test-page", blocks: [announcement] }));
  assert.ok(local.includes('aria-label="Fermer l’annonce : Information du cabinet"'));
  const normal = renderToStaticMarkup(React.createElement(ContentBlock, { settings, block: { ...newBlock("text"), title: "Texte ordinaire" } }));
  assert.ok(!normal.includes("Fermer l’annonce"));
});

test("la fermeture concerne une seule version et un seul emplacement ; la prévisualisation reste indépendante", () => {
  const block = { ...newBlock("announcement"), title: "{{practiceName}}", body: "Information" };
  const settings = initialDocument.settings;
  const key = announcementKey(block, settings, "global");
  assert.equal(key, announcementKey(structuredClone(block), settings, "global"));
  assert.notEqual(key, announcementKey({ ...block, body: "Nouvelle information" }, settings, "global"));
  assert.notEqual(key, announcementKey({ ...block, endsAt: "2026-12-01T10:00:00.000Z" }, settings, "global"));
  assert.notEqual(key, announcementKey(block, settings, "page:a"));
  assert.notEqual(announcementKey(block, settings, "page:a"), announcementKey(block, settings, "page:b"));
  assert.notEqual(key, announcementKey(block, settings, "preview:global"));
  assert.notEqual(key, announcementKey(block, { ...settings, practiceName: "Nouveau nom" }, "global"));
  assert.equal(key, announcementKey(block, { ...settings, contactRecipient: "prive@example.com" }, "global"));
  assert.ok(!key.includes(block.body), "le stockage conserve une empreinte et non le contenu de l'annonce");
});

test("le Markdown n'exécute pas le HTML et neutralise les liens dangereux", () => {
  const html = renderToStaticMarkup(React.createElement(RichText, {
    text: '[Sûr](/contact) [Téléphone](tel:+33123456789) [Dangereux](javascript:alert(1))\n\n<script>alert("test")</script>\n\n![Image](https://example.test/tracker.png)',
    settings: initialDocument.settings,
  }));
  assert.ok(html.includes('href="/contact"'));
  assert.ok(html.includes('href="tel:+33123456789"'));
  assert.ok(!html.includes("javascript:"));
  assert.ok(!html.includes("<script"));
  assert.ok(!html.includes("<img"));
});

test("les données structurées échappent le contenu et les variables suivent les réglages", () => {
  const html = renderToStaticMarkup(React.createElement(StructuredData, { data: { name: "</script><script>alert(1)</script>" } }));
  assert.equal((html.match(/<script/g) || []).length, 1);
  assert.ok(html.includes("\\u003c/script>"));
  const text = renderToStaticMarkup(React.createElement(RichText, {
    text: "{{practiceName}} : {{emails}} : {{address}}",
    settings: { ...initialDocument.settings, practiceName: "Nouveau nom", email: "nouveau@example.com" },
  }));
  assert.ok(text.includes("Nouveau nom"));
  assert.ok(text.includes("nouveau@example.com"));
  assert.ok(!text.includes("{{"));
});

test("les détails restent repliables et les appels à rendez-vous suivent l'équipe", () => {
  const page = initialDocument.pages.find((p) => p.path === "/specialites/dentisterie-numerique")!;
  const split = page.blocks.find((b) => b.type === "split" && b.items.length > 0)!;
  const details = renderToStaticMarkup(React.createElement(ContentBlock, { block: split, settings: initialDocument.settings }));
  assert.ok(details.includes("<details"));
  assert.ok(!details.includes("<details open"));
  assert.ok(details.includes("Comment fonctionne la CFAO au cabinet"));
  assert.ok(details.includes("L&#x27;empreinte optique"));
  const cta = initialDocument.pages.find((p) => p.path === "/")!.blocks.at(-1)!;
  const settings = structuredClone(initialDocument.settings);
  settings.team[0]!.name = "Dr Nouveau";
  settings.team[0]!.doctolibUrl = "https://www.doctolib.fr/nouvelle-reservation";
  const html = renderToStaticMarkup(React.createElement(ContentBlock, { block: cta, settings }));
  assert.ok(html.includes("Dr Nouveau"));
  assert.ok(html.includes("https://www.doctolib.fr/nouvelle-reservation"));
  assert.ok(!html.includes(initialDocument.settings.team[0]!.doctolibUrl.replaceAll("&", "&amp;")));
});

test("le menu accepte une équipe vide et évite les sous-menus sans contenu", () => {
  const html = renderToStaticMarkup(React.createElement(Header, {
    settings: { name: "Cabinet", navigation: [{ label: "Accueil", href: "/", children: [] }], team: [] },
  }));
  assert.ok(!html.includes("<details"));
  assert.ok(!html.includes("Prendre rendez-vous"));
  assert.ok(!html.includes("group-hover:visible"));
});

test("les fenêtres d'image disposent d'un nom, d'un bouton de fermeture et restent fermées initialement", () => {
  const html = renderToStaticMarkup(React.createElement(Figure, {
    src: "/images/cabinet-salle-soin-01.jpg", alt: "Salle de soin", className: "aspect-[4/3]",
  }));
  assert.ok(html.includes('aria-haspopup="dialog"'));
  assert.ok(html.includes("<dialog"));
  assert.ok(html.includes('aria-modal="true"'));
  assert.ok(html.includes('aria-labelledby="'));
  assert.ok(html.includes("Fermer l’image"));
  assert.ok(html.includes("min-h-11"));
  assert.ok(!html.includes("<dialog open"));
  assert.ok(!html.includes('open=""'));
});
