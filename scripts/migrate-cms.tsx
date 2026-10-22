import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { siteConfig, team, specialties, navigation } from "../lib/site-config";
import { blockSchema, documentSchema, type Block } from "../lib/cms/schema";
import Home from "../app/page";
import Cabinet from "../app/cabinet/page";
import Implant from "../app/specialites/implantologie/page";
import Esthetic from "../app/specialites/esthetique-dentaire/page";
import Digital from "../app/specialites/dentisterie-numerique/page";
import Gallery from "../app/galerie/page";
import Patient from "../app/espace-patient/page";
import Contact from "../app/contact/page";
import Legal from "../app/mentions-legales/page";

const require = createRequire(import.meta.url);
Object.assign(globalThis, { React });
const { parse } = require("next/dist/compiled/node-html-parser");
function markdown(node: any): string {
  if (node.nodeType === 3) return node.text.replace(/\s+/g, " ");
  const children = node.childNodes.map(markdown).join("");
  const tag = node.tagName?.toLowerCase();
  if (["script", "style", "svg", "img", "iframe", "link", "button"].includes(tag)) return "";
  if (/^h[1-6]$/.test(tag)) return `\n\n${"#".repeat(Math.max(3, Number(tag[1])))} ${children.trim()}\n\n`;
  if (tag === "summary") return `\n\n### ${children.replace(/\s*\+$/, "").trim()}\n\n`;
  if (tag === "p") return `\n\n${children.trim()}\n\n`;
  if (tag === "li") return `\n- ${children.trim()}\n`;
  if (tag === "br") return "\n";
  if (tag === "a") return `[${children.trim()}](${node.getAttribute("href")})`;
  if (["strong", "b"].includes(tag)) return `**${children}**`;
  return children;
}
const clean = (node: any) => markdown(node).replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const routes = [
  ["/", "Accueil", Home], ["/cabinet", "Le cabinet", Cabinet],
  ["/specialites/implantologie", "Implantologie dentaire", Implant],
  ["/specialites/esthetique-dentaire", "Esthétique dentaire", Esthetic],
  ["/specialites/dentisterie-numerique", "Dentisterie numérique (CFAO)", Digital],
  ["/galerie", "Galerie photo", Gallery], ["/espace-patient", "Espace patient", Patient],
  ["/contact", "Contact", Contact], ["/mentions-legales", "Mentions légales", Legal],
] as const;

const pages = routes.map(([path, title, Component]) => {
  const root = parse(renderToStaticMarkup(<Component />));
  const sections = root.childNodes.filter((node: any) => node.tagName === "SECTION");
  const blocks: Block[] = [];
  for (const [index, original] of sections.entries()) {
    const nodes = path === "/mentions-legales" && index > 0 ? original.querySelectorAll("article") : [original];
    for (const [subindex, node] of nodes.entries()) {
      const eyebrowNode = node.querySelector(".eyebrow");
      const eyebrow = eyebrowNode?.text.trim() || "";
      eyebrowNode?.remove();
      const titleNode = node.querySelector("h1,h2");
      const heading = titleNode?.text.trim().replace(/\s+/g, " ") || "";
      titleNode?.remove();
      const images = node.querySelectorAll("img").map((img: any) => {
        let src = img.getAttribute("src");
        if (src.startsWith("/_next/image")) src = new URL(src, "https://example.test").searchParams.get("url");
        return { src, alt: img.getAttribute("alt") || "Photographie du cabinet", caption: "" };
      });
      const buttons = node.querySelectorAll("a.btn-primary,a.btn-secondary").map((a: any) => ({
        label: a.text.trim().replace(/\s+/g, " "), href: a.getAttribute("href"),
      }));
      node.querySelectorAll("a.btn-primary,a.btn-secondary").forEach((a: any) => a.remove());
      let type: Block["type"] = images.length > 1 ? "gallery" : images.length ? "split" : "text";
      if (images.length === 1 && !node.querySelector("p")) type = "image";
      let body = clean(node);
      const items: { title: string; body: string }[] = [];
      if (!images.length && node.querySelector("h3")) {
        type = "cards";
        for (const h3 of node.querySelectorAll("h3")) {
          const parent = h3.parentNode;
          const title = h3.text.trim();
          h3.remove();
          items.push({ title, body: clean(parent) });
          parent.remove();
        }
        body = clean(node);
      }
      if (path === "/" && [2, 3, 4].includes(index)) {
        type = index === 2 ? "details" : index === 3 ? "specialties" : "team";
        body = "";
      }
      if (path === "/contact" && index === 1) { type = "contact"; body = "Pour toute urgence, privilégiez un appel téléphonique directement au cabinet."; }
      if (path === "/espace-patient" && index === 2) {
        type = "faq";
        for (const details of node.querySelectorAll("details")) {
          items.push({ title: details.querySelector("summary").text.replace(/\s*\+$/, "").trim(), body: details.querySelector("p").text.trim() });
        }
        body = "";
      }
      if (path === "/mentions-legales" && index > 0 && subindex === 0) {
        body = "Le présent site est édité par {{practiceName}}, situé au {{address}}.\n\nTéléphone : {{phone}}\n\nE-mail : {{email}}";
      }
      if (path === "/mentions-legales" && heading === "Données personnelles") {
        body = body.replace(siteConfig.email, "{{email}}");
      }
      blocks.push(blockSchema.parse({
        id: `initial-${blocks.length + 1}`, type, title: heading, eyebrow, body,
        background: original.classNames.includes("bg-surface") ? "surface" : "default",
        images: ["team", "specialties", "details", "contact"].includes(type) ? [] : images,
        buttons: ["team", "specialties", "details", "contact"].includes(type) ? [] : buttons,
        items, imageSide: node.querySelector(".container-site")?.firstElementChild?.tagName === "BUTTON" ? "left" : "right",
        columns: path === "/galerie" || path === "/" ? 3 : 2,
      }));
    }
  }
  return {
    id: path === "/" ? "home" : path.slice(1).replaceAll("/", "-"),
    path, title, description: blocks[0]?.body || siteConfig.description,
    ogImage: blocks.flatMap((b) => b.images)[0]?.src || "", noindex: false, blocks,
  };
});
const settings = {
  name: siteConfig.name, practiceName: siteConfig.practiceName, tagline: siteConfig.tagline,
  url: siteConfig.url, description: siteConfig.description, phone: siteConfig.phone,
  email: siteConfig.email, contactRecipient: "docteurcohena@gmail.com", address: siteConfig.address,
  openingHours: siteConfig.openingHours,
  team: team.map((t) => ({ id: t.slug, name: t.name, title: t.title, bio: t.bio, photo: { src: t.photo, alt: t.photoAlt }, doctolibUrl: t.doctolibUrl })),
  specialties: specialties.map((s) => ({ id: s.slug, title: s.shortTitle, summary: s.summary, href: s.href })),
  navigation: navigation.map((n) => ({ ...n, children: n.children || [] })),
  footerLinks: [{ label: "Mentions légales", href: "/mentions-legales" }],
  credit: { label: "Site réalisé par Karlsefni", href: "https://bafode-cisse.vercel.app/" },
  accent: "#c9a24b", announcements: [],
};
const doc = documentSchema.parse({ settings, pages });
writeFileSync(new URL("../lib/cms/initial-content.json", import.meta.url), JSON.stringify(doc, null, 2) + "\n");
console.log(`Migration : ${doc.pages.length} pages, ${doc.pages.reduce((n, p) => n + p.blocks.length, 0)} blocs.`);
