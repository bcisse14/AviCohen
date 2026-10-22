import { randomUUID } from "node:crypto";
import { query, ensureDatabase, type Query } from "./database";
import { documentSchema, type CmsDocument, type Media } from "./schema";
import { initialDocument } from "./seed";

export class CmsError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type StateRow = Record<string, unknown> & {
  draft: unknown; published: unknown; revision: number; updated_at: string | Date; published_at: string | Date;
};
export type CmsState = {
  draft: CmsDocument; revision: number; updatedAt: string; publishedAt: string;
};
const iso = (value: string | Date) => new Date(value).toISOString();

export function createRepository(execute: Query, initialize: () => Promise<void>) {
  async function ensureState() {
    await initialize();
    await execute(
      "INSERT INTO cms_state (id, draft, published) VALUES (1, $1::jsonb, $1::jsonb) ON CONFLICT (id) DO NOTHING",
      [JSON.stringify(initialDocument)],
    );
  }
  async function readRow(): Promise<StateRow> {
    await ensureState();
    const rows = await execute<StateRow>("SELECT draft, published, revision, updated_at, published_at FROM cms_state WHERE id = 1");
    const row = rows[0];
    if (!row) throw new Error("Le document CMS est introuvable.");
    return row;
  }
  return {
    async getState(): Promise<CmsState> {
      const row = await readRow();
      return { draft: documentSchema.parse(row.draft), revision: row.revision, updatedAt: iso(row.updated_at), publishedAt: iso(row.published_at) };
    },
    async getPublished(): Promise<CmsDocument> {
      return documentSchema.parse((await readRow()).published);
    },
    async save(document: CmsDocument, revision: number, publish: boolean): Promise<CmsState> {
      const valid = documentSchema.parse(document);
      await ensureState();
      // The revision check and version snapshot are one atomic PostgreSQL statement.
      const rows = await execute<StateRow>(
        `WITH previous AS (
          SELECT draft FROM cms_state WHERE id = 1 AND revision = $2 FOR UPDATE
        ), updated AS (
          UPDATE cms_state SET draft = $1::jsonb,
            published = CASE WHEN $3 THEN $1::jsonb ELSE published END,
            published_at = CASE WHEN $3 THEN now() ELSE published_at END,
            revision = revision + 1, updated_at = now()
          WHERE id = 1 AND revision = $2 AND EXISTS (SELECT 1 FROM previous)
          RETURNING draft, published, revision, updated_at, published_at
        ), version AS (
          INSERT INTO cms_versions (document, reason)
          SELECT previous.draft, $4 FROM previous WHERE EXISTS (SELECT 1 FROM updated)
        ), pruned AS (
          DELETE FROM cms_versions WHERE id NOT IN
            (SELECT id FROM cms_versions ORDER BY id DESC LIMIT 29)
            AND EXISTS (SELECT 1 FROM updated)
        ) SELECT * FROM updated`,
        [JSON.stringify(valid), revision, publish, publish ? "Avant publication" : "Avant enregistrement"],
      );
      if (!rows[0]) throw new CmsError(409, "Le contenu a changé dans une autre fenêtre. Exportez vos modifications puis rechargez avant de continuer.");
      const row = rows[0];
      return { draft: documentSchema.parse(row.draft), revision: row.revision, updatedAt: iso(row.updated_at), publishedAt: iso(row.published_at) };
    },
    async versions() {
      await ensureState();
      const rows = await execute<{ id: string; reason: string; created_at: string | Date } & Record<string, unknown>>(
        "SELECT id::text, reason, created_at FROM cms_versions ORDER BY id DESC LIMIT 30",
      );
      return rows.map((row) => ({ id: row.id, reason: row.reason, createdAt: iso(row.created_at) }));
    },
    async restore(id: string, revision: number) {
      await ensureState();
      const rows = await execute<{ document: unknown } & Record<string, unknown>>("SELECT document FROM cms_versions WHERE id = $1", [id]);
      if (!rows[0]) throw new CmsError(404, "Version introuvable.");
      return this.save(documentSchema.parse(rows[0].document), revision, false);
    },
    async media(): Promise<Media[]> {
      await initialize();
      const rows = await execute<{ data: Media } & Record<string, unknown>>("SELECT data FROM cms_media ORDER BY created_at DESC");
      return rows.map((r) => r.data);
    },
    async addMedia(media: Omit<Media, "id" | "uploadedAt">): Promise<Media> {
      await initialize();
      const item: Media = { ...media, id: randomUUID(), uploadedAt: new Date().toISOString() };
      await execute("INSERT INTO cms_media (id, data) VALUES ($1, $2::jsonb)", [item.id, JSON.stringify(item)]);
      return item;
    },
    async removeMedia(id: string) {
      await initialize();
      const rows = await execute("DELETE FROM cms_media WHERE id = $1 RETURNING id", [id]);
      if (!rows.length) throw new CmsError(404, "Média introuvable.");
    },
  };
}

export const repository = createRepository(query, ensureDatabase);
