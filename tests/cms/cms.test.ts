import assert from "node:assert/strict";
import { after, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { schemaSql, type Query } from "../../lib/cms/database";
import { CmsError, createRepository } from "../../lib/cms/repository";
import { documentSchema, isBlockVisible, isSafeImage, isSafeLink, newBlock } from "../../lib/cms/schema";
import { initialDocument } from "../../lib/cms/seed";
import { collectOriginalMedia, renamePage } from "../../lib/cms/editing";
import { signSession, verifySession, sessionSeconds } from "../../lib/cms/auth";
import { readJson, requireSameOrigin } from "../../lib/cms/http";
import sharp from "sharp";
import { normalizeImage } from "../../lib/cms/media";
import { spawnSync } from "node:child_process";
import { scryptSync } from "node:crypto";

const clone = () => structuredClone(initialDocument);
const database = new PGlite();
const execute: Query = async <T extends Record<string, unknown>>(sql: string, params: unknown[] = []) =>
  (await database.query<T>(sql, params)).rows;
let initialized: Promise<void> | undefined;
const repository = createRepository(execute, () => {
  initialized ??= (async () => { for (const sql of schemaSql) await database.exec(sql); })();
  return initialized;
});
after(async () => { await database.close(); });

test("le contenu initial conserve les 9 routes, 44 blocs, les photos et les détails médicaux", () => {
  assert.equal(documentSchema.parse(initialDocument).pages.length, 9);
  assert.equal(initialDocument.pages.reduce((sum, p) => sum + p.blocks.length, 0), 44);
  const data = JSON.stringify(initialDocument);
  for (const content of ["Facettes céramiques en une seule séance", "L'empreinte optique", "tiers payant", "bafodecisse.fr", "docteurcohena@gmail.com", "docteurcoheng@gmail.com"]) {
    assert.ok(data.includes(content), `Contenu manquant : ${content}`);
  }
  assert.ok(collectOriginalMedia(initialDocument).length >= 20);
  assert.ok(!data.includes("Le contenu détaillé est masqué."));
  const clinical = initialDocument.pages.find((p) => p.path === "/specialites/esthetique-dentaire")!.blocks.find((b) => b.type === "gallery")!;
  assert.deepEqual(clinical.images.slice(0, 2).map((image) => image.caption), ["Cas 1 — Avant", "Cas 1 — Après"]);
});

test("validation des routes, liens, images et identifiants", () => {
  for (const href of ["/cabinet", "/contact#formulaire", "https://www.doctolib.fr/a", "mailto:test@example.com", "tel:+33123456789"]) assert.ok(isSafeLink(href), href);
  for (const href of ["javascript:alert(1)", "data:text/html,a", "//evil.test", "/\\evil.test", " https://evil.test", "https://test\n.example"]) assert.ok(!isSafeLink(href), href);
  assert.ok(isSafeImage("/images/Cohen_avi.webp"));
  assert.ok(isSafeImage("https://store-a.public.blob.vercel-storage.com/cms/test.webp"));
  for (const href of ["/images/../secrets", "https://evil.test/a.svg", "data:image/svg+xml,a", "https://store.public.blob.vercel-storage.com.evil.test/image"]) assert.ok(!isSafeImage(href), href);
  const duplicate = clone();
  duplicate.pages.push(structuredClone(duplicate.pages[0]!));
  assert.ok(!documentSchema.safeParse(duplicate).success);
  for (const path of ["/admin", "/api/test", "/preview/x", "/images/a", "/_next/foo", "/Majuscule", "/x/../y"]) {
    const invalid = clone();
    invalid.pages[1]!.path = path;
    assert.ok(!documentSchema.safeParse(invalid).success, path);
  }
  const broken = clone();
  broken.settings.navigation[0]!.href = "/inexistant";
  assert.ok(!documentSchema.safeParse(broken).success);
  const anchor = clone();
  anchor.settings.navigation[0]!.href = "/contact#formulaire";
  assert.ok(documentSchema.safeParse(anchor).success);
});

test("les annonces longues et larges sont validées et suivent leurs bornes temporelles", () => {
  const doc = clone();
  const block = { ...newBlock("announcement"), width: "full" as const, body: "Information importante. ".repeat(1000), startsAt: "2026-10-22T10:00:00.000Z", endsAt: "2026-10-23T10:00:00.000Z" };
  doc.settings.announcements = [block];
  assert.ok(documentSchema.safeParse(doc).success);
  assert.equal(isBlockVisible(block, Date.parse("2026-10-22T09:59:59Z")), false);
  assert.equal(isBlockVisible(block, Date.parse(block.startsAt)), true);
  assert.equal(isBlockVisible(block, Date.parse(block.endsAt)), false);
  assert.equal(isBlockVisible({ ...block, visible: false }, Date.parse(block.startsAt)), false);
  assert.ok(!documentSchema.safeParse({ ...doc, settings: { ...doc.settings, announcements: [{ ...block, endsAt: block.startsAt }] } }).success);
  doc.settings.announcements[0]!.body = "x".repeat(30001);
  assert.ok(!documentSchema.safeParse(doc).success);
});

test("renommer une page met à jour navigation, spécialités, boutons et liens textuels", () => {
  const doc = clone();
  doc.pages[0]!.blocks[0]!.body += "\n\n[Voir](/cabinet)";
  const page = doc.pages.find((p) => p.path === "/cabinet")!;
  const renamed = renamePage(doc, page.id, "/notre-cabinet");
  assert.ok(documentSchema.safeParse(renamed).success);
  assert.ok(renamed.settings.navigation.some((n) => n.href === "/notre-cabinet"));
  assert.ok(renamed.pages[0]!.blocks[0]!.body.includes("[Voir](/notre-cabinet)"));
  assert.ok(!JSON.stringify(renamed).includes('"href":"/cabinet"'));
  assert.equal(doc.pages.find((p) => p.id === page.id)!.path, "/cabinet");
  assert.deepEqual(renamed.redirects, [{ from: "/cabinet", pageId: page.id }]);
  const twice = renamePage(renamed, page.id, "/presentation");
  assert.equal(twice.redirects.length, 2);
  assert.ok(twice.redirects.every((r) => r.pageId === page.id));
  const back = renamePage(twice, page.id, "/cabinet");
  assert.ok(documentSchema.safeParse(back).success);
  assert.ok(!back.redirects.some((r) => r.from === "/cabinet"));
});

test("brouillon, publication, concurrence, restauration et rétention utilisent PostgreSQL", async () => {
  const first = await repository.getState();
  assert.equal(first.revision, 1);
  const draft = clone();
  draft.pages[0]!.title = "Nouvelle version non publiée";
  let state = await repository.save(draft, first.revision, false);
  assert.equal(state.revision, 2);
  assert.equal((await repository.getPublished()).pages[0]!.title, initialDocument.pages[0]!.title);
  await assert.rejects(repository.save(draft, 1, true), (error: unknown) => error instanceof CmsError && error.status === 409);
  state = await repository.save(draft, state.revision, true);
  assert.equal((await repository.getPublished()).pages[0]!.title, draft.pages[0]!.title);
  const versions = await repository.versions();
  assert.equal(versions.length, 2);
  const old = versions.at(-1)!;
  state = await repository.restore(old.id, state.revision);
  assert.equal(state.draft.pages[0]!.title, initialDocument.pages[0]!.title);
  assert.equal((await repository.getPublished()).pages[0]!.title, draft.pages[0]!.title, "restaurer ne publie pas");
  for (let i = 0; i < 33; i++) state = await repository.save(state.draft, state.revision, false);
  assert.equal((await repository.versions()).length, 30);
  await assert.rejects(repository.restore(old.id, state.revision), (error: unknown) => error instanceof CmsError && error.status === 404);
  const revision = state.revision;
  const concurrent = await Promise.allSettled([repository.save(draft, revision, false), repository.save(draft, revision, false)]);
  assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(concurrent.filter((r) => r.status === "rejected").length, 1);
});

test("les médias sont persistants et leur retrait ne modifie aucun contenu", async () => {
  const state = await repository.getState();
  const image = collectOriginalMedia(initialDocument)[0]!;
  const media = await repository.addMedia({ src: image.src, alt: image.alt, caption: "", fit: "cover", position: "center", ratio: "landscape", name: "test.webp", width: 1200, height: 800 });
  assert.ok((await repository.media()).some((m) => m.id === media.id));
  await repository.removeMedia(media.id);
  assert.ok(!(await repository.media()).some((m) => m.id === media.id));
  assert.equal((await repository.getState()).revision, state.revision);
  await assert.rejects(repository.removeMedia(media.id), (error: unknown) => error instanceof CmsError && error.status === 404);
});

test("sessions signées, expiration et révocation lors du changement des identifiants", () => {
  const keys = ["CMS_ADMIN_EMAIL", "CMS_ADMIN_PASSWORD_HASH", "CMS_SESSION_SECRET", "DATABASE_URL"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.CMS_ADMIN_EMAIL = "admin@example.com";
    const hash = `scrypt:${"a".repeat(32)}:${"b".repeat(128)}`;
    process.env.CMS_ADMIN_PASSWORD_HASH = hash;
    process.env.CMS_SESSION_SECRET = "s".repeat(64);
    process.env.DATABASE_URL = "postgresql://localhost/test";
    const now = Date.now();
    const token = signSession(now);
    assert.equal(verifySession(token, now), true);
    assert.equal(verifySession(token + "x", now), false);
    assert.equal(verifySession(undefined, now), false);
    assert.equal(verifySession(token, now + sessionSeconds * 1000), false);
    process.env.CMS_ADMIN_PASSWORD_HASH = `scrypt:${"a".repeat(32)}:${"c".repeat(128)}`;
    assert.equal(verifySession(token, now), false);
    process.env.CMS_ADMIN_PASSWORD_HASH = hash;
    process.env.CMS_SESSION_SECRET = "n".repeat(64);
    assert.equal(verifySession(token, now), false);
  } finally {
    for (const key of keys) { const value = previous[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test("les écritures exigent une origine identique et limitent réellement le flux reçu", async () => {
  const request = new Request("https://cabinet.test/api/admin/content", { method: "PUT", headers: { origin: "https://cabinet.test" }, body: '{"ok":true}' });
  assert.doesNotThrow(() => requireSameOrigin(request));
  assert.deepEqual(await readJson(request), { ok: true });
  assert.throws(() => requireSameOrigin(new Request("https://cabinet.test/api/admin/content", { headers: { origin: "https://evil.test" } })), (error: unknown) => error instanceof CmsError && error.status === 403);
  assert.throws(() => requireSameOrigin(new Request("https://cabinet.test/api/admin/content")), (error: unknown) => error instanceof CmsError && error.status === 403);
  await assert.rejects(readJson(new Request("https://cabinet.test", { method: "POST", body: "x".repeat(5000) }), 100), (error: unknown) => error instanceof CmsError && error.status === 413);
  await assert.rejects(readJson(new Request("https://cabinet.test", { method: "POST", body: "not JSON" })), (error: unknown) => error instanceof CmsError && error.status === 400);
});

test("les imports d'image sont vérifiés, redimensionnés et débarrassés des métadonnées", async () => {
  const source = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: "#c9a24b" } })
    .jpeg().withMetadata({ orientation: 1 }).toBuffer();
  const normalized = await normalizeImage(new Uint8Array(source).buffer);
  const output = await sharp(normalized.data).metadata();
  assert.equal(output.format, "webp");
  assert.equal(normalized.width, 2400);
  assert.equal(normalized.height, 1200);
  assert.equal(output.exif, undefined);
  assert.equal(output.icc, undefined);
  const small = await sharp({ create: { width: 20, height: 10, channels: 3, background: "#ffffff" } }).png().toBuffer();
  const untouched = await normalizeImage(new Uint8Array(small).buffer);
  assert.equal(untouched.width, 20);
  assert.equal(untouched.height, 10);
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>');
  await assert.rejects(normalizeImage(new Uint8Array(svg).buffer), (error: unknown) => error instanceof CmsError && error.status === 422);
});

test("l'outil de configuration produit une empreinte scrypt compatible et refuse un mot de passe court", () => {
  const password = "Mot de passe de test uniquement";
  const result = spawnSync(process.execPath, ["scripts/cms-password.mjs"], { input: password + "\n", encoding: "utf8" });
  assert.equal(result.status, 0);
  const match = /CMS_ADMIN_PASSWORD_HASH=scrypt:([a-f0-9]{32}):([a-f0-9]{128})/.exec(result.stdout);
  assert.ok(match?.[1] && match[2]);
  assert.equal(scryptSync(password, match[1], 64).toString("hex"), match[2]);
  assert.ok(/CMS_SESSION_SECRET=[a-f0-9]{96}/.test(result.stdout));
  const short = spawnSync(process.execPath, ["scripts/cms-password.mjs"], { input: "court\n", encoding: "utf8" });
  assert.equal(short.status, 1);
  assert.ok(!short.stdout.includes("CMS_SESSION_SECRET="));
});
