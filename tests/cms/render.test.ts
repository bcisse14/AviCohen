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

// The tsx runner follows the repository's preserved JSX mode.
Object.assign(globalThis, { React });

test("les annonces longues ne sont ni tronquées ni enfermées dans une hauteur fixe", () => {
  const body = "Annonce du cabinet. ".repeat(1200);
  const html = renderToStaticMarkup(React.createElement(ContentBlock, {
    block: { ...newBlock("announcement"), width: "full", body, title: "Informations" },
    settings: initialDocument.settings,
  }));
  assert.ok(html.includes("max-w-none"));
  assert.ok(html.includes(body.trim()));
  assert.ok(!html.includes("line-clamp"));
  assert.ok(!html.includes("overflow-hidden"));
  assert.ok(!html.includes("max-h-"));
  const narrow = renderToStaticMarkup(React.createElement(ContentBlock, {
    block: { ...newBlock("announcement"), width: "compact", body: "Court" },
    settings: initialDocument.settings,
  }));
  assert.ok(narrow.includes("max-w-3xl"));
  assert.equal((html.match(/Fermer l’annonce<\/span>/g) || []).length, 2);
});

test("toutes les annonces, locales et globales, sont fermables sans rendre les pages ordinaires masquables", () => {
  const settings = structuredClone(initialDocument.settings);
  const announcement = { ...newBlock("announcement"), title: "Information du cabinet" };
  settings.announcements = [announcement];
  const global = renderToStaticMarkup(React.createElement(PublicShell, { settings, children: "Contenu principal" }));
  assert.ok(global.includes('aria-label="Annonce : Information du cabinet"'));
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
    text: "{{practiceName}} — {{emails}} — {{address}}",
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
