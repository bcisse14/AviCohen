import assert from "node:assert/strict";
import { after, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { schemaSql, type Query } from "../../lib/cms/database";
import { CmsError, createRepository } from "../../lib/cms/repository";
import { documentSchema, isBlockVisible, isSafeImage, isSafeLink, newBlock } from "../../lib/cms/schema";
import { initialDocument } from "../../lib/cms/seed";
import { collectOriginalMedia, renamePage } from "../../lib/cms/editing";
import { checkCredentials, configurationIssues, signSession, verifySession, sessionSeconds } from "../../lib/cms/auth";
import { neonConfig } from "@neondatabase/serverless";
import { POST as login } from "../../app/api/admin/login/route";
import { readJson, requireSameOrigin } from "../../lib/cms/http";
import sharp from "sharp";
import { normalizeImage } from "../../lib/cms/media";
import { spawnSync } from "node:child_process";
import { scryptSync } from "node:crypto";
import { PublicationError, publicationTargetSchema, publishSelection } from "../../lib/cms/publication";

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
  assert.deepEqual(clinical.images.slice(0, 2).map((image) => image.caption), ["Cas 1 : Avant", "Cas 1 : Après"]);
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

test("les médias inutilisés sont supprimés définitivement sans modifier le contenu et ne peuvent plus être réutilisés", async () => {
  const state = await repository.getState();
  const image = collectOriginalMedia(initialDocument)[0]!;
  const media = await repository.addMedia({ src: "https://test.public.blob.vercel-storage.com/unused.webp", alt: image.alt, caption: "", fit: "cover", position: "center", ratio: "landscape", name: "test.webp", width: 1200, height: 800 });
  assert.ok((await repository.media()).some((m) => m.id === media.id));
  const deleted: string[] = [];
  const revision = await repository.removeMedia(media.id, async (src) => { deleted.push(src); });
  assert.deepEqual(deleted, [media.src]);
  assert.deepEqual(revision, { previousRevision: state.revision, revision: state.revision + 1 });
  assert.ok(!(await repository.media()).some((m) => m.id === media.id));
  assert.deepEqual((await repository.getState()).draft, state.draft);
  await assert.rejects(repository.removeMedia(media.id, async () => {}), (error: unknown) => error instanceof CmsError && error.status === 404);
  const reused = structuredClone(state.draft);
  reused.pages[0]!.ogImage = media.src;
  await assert.rejects(repository.save(reused, revision.revision, false), (error: unknown) => error instanceof CmsError && error.status === 409 && error.message.includes("image supprimée"));
});

test("la suppression protège brouillon, publication, historique et médias d’origine ; un échec Blob est récupérable", async () => {
  let state = await repository.getState();
  const media = await repository.addMedia({
    src: "https://test.public.blob.vercel-storage.com/protected.webp", alt: "Photo protégée",
    caption: "", fit: "cover", position: "center", ratio: "landscape", name: "protected.webp", width: 1200, height: 800,
  });
  const draft = structuredClone(state.draft);
  draft.pages[0]!.ogImage = media.src;
  state = await repository.save(draft, state.revision, false);
  let deletions = 0;
  const remove = () => repository.removeMedia(media.id, async () => { deletions++; });
  await assert.rejects(remove(), (error: unknown) => error instanceof CmsError && error.status === 409);
  state = await repository.save(draft, state.revision, true);
  const noImage = structuredClone(draft);
  noImage.pages[0]!.ogImage = "";
  state = await repository.save(noImage, state.revision, false);
  await assert.rejects(remove(), (error: unknown) => error instanceof CmsError && error.status === 409);
  state = await repository.save(noImage, state.revision, true);
  await assert.rejects(remove(), (error: unknown) => error instanceof CmsError && error.status === 409);
  assert.equal(deletions, 0);
  const original = await repository.addMedia({ ...media, src: "/images/cabinet-salle-soin-01.jpg" });
  await assert.rejects(repository.removeMedia(original.id, async () => { deletions++; }), (error: unknown) => error instanceof CmsError && error.status === 422);
  const unused = await repository.addMedia({ ...media, src: "https://test.public.blob.vercel-storage.com/retry.webp" });
  await assert.rejects(repository.removeMedia(unused.id, async () => { throw new Error("Storage unavailable"); }),
    (error: unknown) => error instanceof CmsError && error.status === 502);
  assert.ok((await repository.media()).some((item) => item.id === unused.id));
  const fresh = await repository.getState();
  const blocked = structuredClone(fresh.draft);
  blocked.settings.team[0]!.photo.src = unused.src;
  await assert.rejects(repository.save(blocked, fresh.revision, false), (error: unknown) => error instanceof CmsError && error.status === 409);
  await repository.removeMedia(unused.id, async () => { deletions++; });
  assert.equal(deletions, 1);
  assert.ok(!(await repository.media()).some((item) => item.id === unused.id));
});

test("une suppression en cours bloque la réutilisation depuis un onglet concurrent", async () => {
  const media = await repository.addMedia({
    src: "https://test.public.blob.vercel-storage.com/concurrent.webp", alt: "Photo",
    caption: "", fit: "cover", position: "center", ratio: "landscape", name: "concurrent.webp", width: 100, height: 100,
  });
  const before = await repository.getState();
  await repository.removeMedia(media.id, async () => {
    const current = await repository.getState();
    const draft = structuredClone(current.draft);
    draft.pages[0]!.ogImage = media.src;
    await assert.rejects(repository.save(draft, before.revision, false), (error: unknown) => error instanceof CmsError && error.status === 409);
    await assert.rejects(repository.save(draft, current.revision, false), (error: unknown) => error instanceof CmsError && error.status === 409);
  });
});

test("la publication individuelle isole annonces, blocs et réglages et conserve les autres brouillons dans PostgreSQL", async () => {
  let state = await repository.getState();
  state = await repository.save(clone(), state.revision, true);
  const draft = clone();
  const first = { ...newBlock("announcement"), title: "Annonce A" };
  const second = { ...newBlock("announcement"), title: "Annonce B privée" };
  draft.settings.announcements = [first, second];
  draft.settings.phone = "Téléphone en brouillon";
  const page = draft.pages[0]!;
  page.title = "Titre encore privé";
  page.blocks[0]!.body = "Premier bloc publié seul";
  page.blocks[1]!.body = "Autre bloc privé";
  state = await repository.save(draft, state.revision, { type: "announcement", id: first.id });
  let live = await repository.getPublished();
  assert.deepEqual(live.settings.announcements, [first]);
  assert.equal(live.settings.phone, initialDocument.settings.phone);
  assert.deepEqual(live.pages, initialDocument.pages);
  assert.deepEqual(state.draft, draft);
  await assert.rejects(repository.save(draft, state.revision - 1, { type: "announcement", id: second.id }),
    (error: unknown) => error instanceof CmsError && error.status === 409);
  state = await repository.save(draft, state.revision, { type: "block", pageId: page.id, id: page.blocks[0]!.id });
  live = await repository.getPublished();
  assert.equal(live.pages[0]!.blocks[0]!.body, page.blocks[0]!.body);
  assert.deepEqual(live.pages[0]!.blocks.slice(1), initialDocument.pages[0]!.blocks.slice(1));
  assert.equal(live.pages[0]!.title, initialDocument.pages[0]!.title);
  assert.deepEqual(live.pages.slice(1), initialDocument.pages.slice(1));
  const beforeSettings = structuredClone(live.pages);
  state = await repository.save(draft, state.revision, { type: "settings" });
  live = await repository.getPublished();
  assert.equal(live.settings.phone, draft.settings.phone);
  assert.deepEqual(live.settings.announcements, [first]);
  assert.deepEqual(live.pages, beforeSettings);
  assert.deepEqual(state.draft, draft);
  const extra = { ...newBlock("text"), body: "Nouveau bloc seul" };
  page.blocks.splice(1, 0, extra);
  state = await repository.save(draft, state.revision, { type: "block", pageId: page.id, id: extra.id });
  live = await repository.getPublished();
  assert.deepEqual(live.pages[0]!.blocks[1], extra);
  assert.equal(live.pages[0]!.blocks[2]!.body, initialDocument.pages[0]!.blocks[1]!.body);
  assert.ok((await repository.versions()).some((version) => version.reason.includes("publication individuelle")));
  const stale = state.revision;
  const concurrent = await Promise.allSettled([
    repository.save(draft, stale, { type: "announcement", id: second.id }),
    repository.save(draft, stale, { type: "settings" }),
  ]);
  assert.equal(concurrent.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(concurrent.filter((result) => result.status === "rejected").length, 1);
});

test("une publication individuelle refuse les dépendances absentes et les cibles invalides sans écriture", async () => {
  let state = await repository.getState();
  state = await repository.save(clone(), state.revision, true);
  const draft = clone();
  const page = { ...structuredClone(draft.pages[0]!), id: "new-page", path: "/nouvelle", title: "Nouvelle page" };
  draft.pages.push(page);
  draft.settings.navigation.push({ label: "Nouvelle", href: page.path, children: [] });
  const announcement = { ...newBlock("announcement"), buttons: [{ label: "Voir", href: page.path }] };
  draft.settings.announcements.push(announcement);
  const liveBefore = await repository.getPublished();
  for (const target of [
    { type: "settings" } as const,
    { type: "block", pageId: page.id, id: page.blocks[0]!.id } as const,
    { type: "announcement", id: announcement.id } as const,
    { type: "announcement", id: "inexistant" } as const,
    { type: "page", pageId: "inexistante" } as const,
  ]) {
    await assert.rejects(repository.save(draft, state.revision, target), (error: unknown) => error instanceof CmsError && error.status === 422);
    assert.deepEqual(await repository.getPublished(), liveBefore);
    assert.equal((await repository.getState()).revision, state.revision);
  }
  state = await repository.save(draft, state.revision, { type: "page", pageId: page.id });
  assert.deepEqual((await repository.getPublished()).pages.find((p) => p.id === page.id), page);
  assert.deepEqual((await repository.getPublished()).settings, initialDocument.settings);
  state = await repository.save(draft, state.revision, { type: "settings" });
  assert.deepEqual((await repository.getPublished()).settings.navigation, draft.settings.navigation);
  assert.deepEqual((await repository.getPublished()).settings.announcements, []);
  assert.deepEqual(state.draft, draft);
  assert.equal(publicationTargetSchema.safeParse({ type: "block", id: "bloc" }).success, false);
});

test("une page renommée conserve ses liens publics et les publications unitaires respectent l’ordre sans publier de suppressions", () => {
  const live = clone();
  const page = live.pages.find((p) => p.path === "/cabinet")!;
  const draft = renamePage(live, page.id, "/presentation");
  const next = publishSelection(live, draft, { type: "page", pageId: page.id });
  assert.equal(next.pages.find((p) => p.id === page.id)!.path, "/presentation");
  assert.deepEqual(next.settings, live.settings);
  assert.ok(next.redirects.some((redirect) => redirect.from === "/cabinet" && redirect.pageId === page.id));
  const a = newBlock("announcement"), b = newBlock("announcement"), c = newBlock("announcement");
  live.settings.announcements = [a, c];
  draft.settings.announcements = [b, c];
  const inserted = publishSelection(live, draft, { type: "announcement", id: b.id });
  assert.deepEqual(inserted.settings.announcements.map((item) => item.id), [a.id, b.id, c.id]);
  assert.deepEqual(live.settings.announcements, [a, c], "le document publié initial ne doit pas être muté");
  live.settings.announcements = Array.from({ length: 20 }, () => newBlock("announcement"));
  assert.throws(() => publishSelection(live, draft, { type: "announcement", id: b.id }), PublicationError);
});

test("le retrait unitaire puis global supprime les annonces publiées et privées sans publier les autres modifications", async () => {
  let state = await repository.getState();
  const initial = clone();
  const global = { ...newBlock("announcement"), title: "Annonce globale" };
  const local = { ...newBlock("announcement"), title: "Annonce locale" };
  const other = { ...newBlock("announcement"), title: "Autre annonce" };
  initial.settings.announcements = [global, other];
  initial.pages[0]!.blocks.push(local);
  state = await repository.save(initial, state.revision, true);
  const draft = structuredClone(initial);
  draft.settings.phone = "Coordonnées privées";
  draft.pages[0]!.title = "Titre privé";
  draft.pages[0]!.blocks[0]!.body = "Texte privé";
  state = await repository.save(draft, state.revision, { type: "remove-announcement", id: global.id });
  let live = await repository.getPublished();
  assert.deepEqual(live.settings.announcements, [other]);
  assert.deepEqual(state.draft.settings.announcements, [other]);
  assert.equal(live.settings.phone, initial.settings.phone);
  assert.deepEqual(live.pages, initial.pages);
  assert.equal(state.draft.pages[0]!.title, draft.pages[0]!.title);
  await assert.rejects(repository.save(state.draft, state.revision - 1, { type: "remove-all-announcements" }),
    (error: unknown) => error instanceof CmsError && error.status === 409);
  const revision = state.revision;
  await assert.rejects(repository.save(state.draft, revision, {
    type: "remove-announcement", pageId: initial.pages[0]!.id, id: initial.pages[0]!.blocks[0]!.id,
  }), (error: unknown) => error instanceof CmsError && error.status === 422);
  assert.equal((await repository.getState()).revision, revision);
  state = await repository.save(state.draft, state.revision, {
    type: "remove-announcement", pageId: initial.pages[0]!.id, id: local.id,
  });
  live = await repository.getPublished();
  assert.ok(!live.pages[0]!.blocks.some((block) => block.id === local.id));
  assert.ok(!state.draft.pages[0]!.blocks.some((block) => block.id === local.id));
  const privateOnly = { ...newBlock("announcement"), title: "Jamais publiée" };
  const pending = structuredClone(state.draft);
  pending.settings.announcements = [privateOnly]; // The other announcement is still published.
  pending.pages[1]!.blocks.push({ ...newBlock("announcement"), title: "Locale privée" });
  state = await repository.save(pending, state.revision, false);
  const before = await repository.getPublished();
  state = await repository.save(state.draft, state.revision, { type: "remove-all-announcements" });
  live = await repository.getPublished();
  assert.deepEqual(live.settings.announcements, []);
  assert.deepEqual(state.draft.settings.announcements, []);
  assert.ok(live.pages.every((page) => page.blocks.every((block) => block.type !== "announcement")));
  assert.ok(state.draft.pages.every((page) => page.blocks.every((block) => block.type !== "announcement")));
  assert.deepEqual(live.pages, before.pages);
  assert.deepEqual({ ...live.settings, announcements: [] }, { ...before.settings, announcements: [] });
  assert.equal(state.draft.settings.phone, pending.settings.phone);
  assert.equal(state.draft.pages[0]!.blocks[0]!.body, pending.pages[0]!.blocks[0]!.body);
  const removalVersion = (await repository.versions()).find((version) => version.reason.includes("remove-all-announcements"))!;
  const restored = await repository.restore(removalVersion.id, state.revision);
  assert.ok(restored.draft.settings.announcements.some((block) => block.id === privateOnly.id));
  assert.deepEqual((await repository.getPublished()).settings.announcements, []);
});

test("sessions signées, expiration et révocation lors du changement des identifiants", () => {
  const keys = ["CMS_ADMIN_USERNAME", "CMS_ADMIN_EMAIL", "CMS_ADMIN_PASSWORD_HASH", "CMS_SESSION_SECRET", "DATABASE_URL"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    delete process.env.CMS_ADMIN_USERNAME;
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
    process.env.CMS_ADMIN_USERNAME = "avicohen";
    delete process.env.CMS_ADMIN_EMAIL;
    assert.deepEqual(configurationIssues(), []);
    assert.equal(verifySession(token, now), false);
    const usernameToken = signSession(now);
    assert.equal(verifySession(usernameToken, now), true);
    process.env.CMS_ADMIN_USERNAME = "autre-admin";
    assert.equal(verifySession(usernameToken, now), false);
    process.env.CMS_ADMIN_USERNAME = "invalide avec espaces";
    assert.ok(configurationIssues().some((issue) => issue.startsWith("CMS_ADMIN_USERNAME")));
    process.env.CMS_ADMIN_USERNAME = "avicohen";
    process.env.CMS_SESSION_SECRET = "n".repeat(64);
    assert.equal(verifySession(usernameToken, now), false);
  } finally {
    for (const key of keys) { const value = previous[key]; if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test("la connexion accepte un identifiant ou un ancien e-mail et conserve les protections", async () => {
  const keys = ["CMS_ADMIN_USERNAME", "CMS_ADMIN_EMAIL", "CMS_ADMIN_PASSWORD_HASH", "CMS_SESSION_SECRET", "DATABASE_URL"] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const previousFetch = neonConfig.fetchFunction;
  const password = "test-password-unique";
  let attempts = 0;
  try {
    process.env.CMS_ADMIN_USERNAME = "avicohen";
    delete process.env.CMS_ADMIN_EMAIL;
    process.env.CMS_ADMIN_PASSWORD_HASH = `scrypt:${"a".repeat(32)}:${scryptSync(password, "a".repeat(32), 64).toString("hex")}`;
    process.env.CMS_SESSION_SECRET = "s".repeat(64);
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
    neonConfig.fetchFunction = async (_url: unknown, options?: RequestInit) => {
      assert.equal(options?.cache, "no-store");
      const body: unknown = JSON.parse(String(options?.body));
      if (typeof body === "object" && body !== null && "queries" in body && Array.isArray(body.queries)) {
        return Response.json({ results: body.queries.map(() => ({ fields: [], rows: [] })) });
      }
      attempts++;
      return Response.json({ fields: [{ name: "attempts", dataTypeID: 23 }], rows: [[String(attempts)]] });
    };
    await assert.doesNotReject(checkCredentials(" AVICOHEN ", password));
    await assert.rejects(checkCredentials("autre-admin", password), (error: unknown) => error instanceof CmsError && error.status === 401);
    await assert.rejects(checkCredentials("avicohen", "incorrect"), (error: unknown) => error instanceof CmsError && error.status === 401);
    const request = (body: object) => new Request("https://cabinet.test/api/admin/login", {
      method: "POST", headers: { origin: "https://cabinet.test", "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const response = await login(request({ identifier: "avicohen", password }));
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("set-cookie")?.includes("HttpOnly"));
    assert.equal((await login(request({ identifier: "", password }))).status, 422);
    delete process.env.CMS_ADMIN_USERNAME;
    process.env.CMS_ADMIN_EMAIL = "admin@example.com";
    assert.equal((await login(request({ email: "admin@example.com", password }))).status, 200);
    assert.equal((await login(request({ identifier: "admin@example.com", password }))).status, 200);
    attempts = 30;
    await assert.rejects(checkCredentials("admin@example.com", password), (error: unknown) => error instanceof CmsError && error.status === 429);
  } finally {
    neonConfig.fetchFunction = previousFetch;
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
