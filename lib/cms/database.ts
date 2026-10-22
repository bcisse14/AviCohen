import { neon } from "@neondatabase/serverless";

export const schemaSql = [
  `CREATE TABLE IF NOT EXISTS cms_state (
    id integer PRIMARY KEY CHECK (id = 1),
    draft jsonb NOT NULL,
    published jsonb NOT NULL,
    revision integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS cms_versions (
    id bigserial PRIMARY KEY,
    document jsonb NOT NULL,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS cms_media (
    id uuid PRIMARY KEY,
    data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS cms_deleted_media (
    src text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS cms_login_attempts (
    key text PRIMARY KEY,
    attempts integer NOT NULL,
    window_start timestamptz NOT NULL
  )`,
] as const;

export type Query = <T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
let connection: ReturnType<typeof neon> | undefined;
function getConnection() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante.");
  connection ??= neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } });
  return connection;
}
export const query: Query = async <T extends Record<string, unknown>>(sql: string, params: unknown[] = []) => {
  return await getConnection().query(sql, params) as T[];
};

let ready: Promise<void> | undefined;
export function ensureDatabase(): Promise<void> {
  ready ??= (async () => {
    const sql = getConnection();
    await sql.transaction([
      sql.query("SELECT pg_advisory_xact_lock(hashtext('cohen-mini-cms-schema-v1'))"),
      ...schemaSql.map((statement) => sql.query(statement)),
    ]);
  })().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}
