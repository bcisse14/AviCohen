import { randomUUID } from "node:crypto";
import { query, ensureDatabase, type Query } from "./database";
import { documentSchema, isSafeImage, type CmsDocument, type Media } from "./schema";
import { initialDocument } from "./seed";
import { PublicationError, publishSelection, removeAnnouncements, type PublicationTarget } from "./publication";

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
    async save(document: CmsDocument, revision: number, publish: boolean | PublicationTarget): Promise<CmsState> {
      const valid = documentSchema.parse(document);
      const nextDraft = typeof publish === "object" ? documentSchema.parse(removeAnnouncements(valid, publish)) : valid;
      await ensureState();
      let published: CmsDocument | undefined;
      if (typeof publish !== "boolean") {
        const current = await readRow();
        if (current.revision !== revision) throw new CmsError(409, "Le contenu a changé dans une autre fenêtre. Exportez vos modifications puis rechargez avant de continuer.");
        try {
          published = publishSelection(documentSchema.parse(current.published), valid, publish);
        } catch (error) {
          if (error instanceof PublicationError) throw new CmsError(422, error.message);
          throw error;
        }
      }
      // The revision check and version snapshot are one atomic PostgreSQL statement.
      const rows = await execute<StateRow>(
        `WITH previous AS (
          SELECT draft FROM cms_state WHERE id = 1 AND revision = $2 FOR UPDATE
        ), updated AS (
          UPDATE cms_state SET draft = $1::jsonb,
            published = CASE WHEN $3 THEN $5::jsonb ELSE published END,
            published_at = CASE WHEN $3 THEN now() ELSE published_at END,
            revision = revision + 1, updated_at = now()
          WHERE id = 1 AND revision = $2 AND EXISTS (SELECT 1 FROM previous)
            AND NOT EXISTS (
              SELECT 1 FROM cms_deleted_media
              WHERE strpos($1::text, src) > 0 OR ($3 AND strpos($5::text, src) > 0)
            )
          RETURNING draft, published, revision, updated_at, published_at
        ), version AS (
          INSERT INTO cms_versions (document, reason)
          SELECT previous.draft, $4 FROM previous WHERE EXISTS (SELECT 1 FROM updated)
        ), pruned AS (
          DELETE FROM cms_versions WHERE id NOT IN
            (SELECT id FROM cms_versions ORDER BY id DESC LIMIT 29)
            AND EXISTS (SELECT 1 FROM updated)
        ) SELECT * FROM updated`,
        [JSON.stringify(nextDraft), revision, publish !== false,
          typeof publish === "object" ? `Avant publication individuelle (${publish.type})` : publish ? "Avant publication" : "Avant enregistrement",
          JSON.stringify(published ?? valid)],
      );
      if (!rows[0]) {
        const removed = await execute("SELECT src FROM cms_deleted_media WHERE strpos($1::text, src) > 0 OR ($2 AND strpos($3::text, src) > 0) LIMIT 1",
          [JSON.stringify(nextDraft), publish !== false, JSON.stringify(published ?? valid)]);
        if (removed.length) throw new CmsError(409, "Ce contenu utilise une image supprimée ou en cours de suppression. Remplacez cette image avant d’enregistrer.");
        throw new CmsError(409, "Le contenu a changé dans une autre fenêtre. Exportez vos modifications puis rechargez avant de continuer.");
      }
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
    async removeMedia(id: string, deleteFile: (src: string) => Promise<void>) {
      const current = await readRow();
      const media = await execute<{ data: Media } & Record<string, unknown>>("SELECT data FROM cms_media WHERE id = $1", [id]);
      const item = media[0]?.data;
      if (!item) throw new CmsError(404, "Média introuvable.");
      if (!item.src.startsWith("https://") || !isSafeImage(item.src)) throw new CmsError(422, "Seules les images importées dans Vercel Blob peuvent être supprimées définitivement.");
      // Reserve the URL before deleting externally; the revision prevents concurrent saves from reusing it.
      const reserved = await execute<{ revision: number } & Record<string, unknown>>(
        `WITH locked AS (
          SELECT id FROM cms_state WHERE id = 1 AND revision = $2 FOR UPDATE
        ), updated AS (
          UPDATE cms_state SET revision = revision + 1
          WHERE id = 1 AND revision = $2 AND EXISTS (SELECT 1 FROM locked)
            AND strpos(draft::text, $1) = 0 AND strpos(published::text, $1) = 0
            AND NOT EXISTS (SELECT 1 FROM cms_versions WHERE strpos(document::text, $1) > 0)
            AND NOT EXISTS (SELECT 1 FROM cms_media WHERE id <> $3 AND strpos(data::text, $1) > 0)
          RETURNING revision
        ), reserved AS (
          INSERT INTO cms_deleted_media (src) SELECT $1 FROM updated ON CONFLICT (src) DO NOTHING
        ) SELECT revision FROM updated`,
        [item.src, current.revision, id],
      );
      if (!reserved[0]) throw new CmsError(409, "Suppression refusée : cette image est utilisée dans un brouillon, le site publié, l’historique ou un autre média, ou le contenu vient de changer. Rechargez la médiathèque et retirez ses utilisations avant de réessayer.");
      try {
        await deleteFile(item.src);
      } catch (error) {
        console.error("Échec de la suppression définitive du fichier Blob :", error instanceof Error ? error.name : "Erreur inconnue");
        throw new CmsError(502, "Le stockage n’a pas confirmé la suppression. L’image reste dans la médiathèque, mais est bloquée pour de nouvelles utilisations. Rechargez l’administration puis réessayez la suppression.");
      }
      await execute("DELETE FROM cms_media WHERE id = $1", [id]);
      return { previousRevision: current.revision, revision: reserved[0].revision };
    },
  };
}

export const repository = createRepository(query, ensureDatabase);
