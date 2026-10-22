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
  `CREATE TABLE IF NOT EXISTS cms_login_attempts (
    key text PRIMARY KEY,
    attempts integer NOT NULL,
    window_start timestamptz NOT NULL
  )`,
] as const;

export type Query = <T extends Record<string, unknown> = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;
let connection: ReturnType<typeof neon> | undefined;
export const query: Query = async <T extends Record<string, unknown>>(sql: string, params: unknown[] = []) => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL manquante.");
  connection ??= neon(process.env.DATABASE_URL);
  return await connection.query(sql, params) as T[];
};

let ready: Promise<void> | undefined;
export function ensureDatabase(): Promise<void> {
  ready ??= (async () => {
    for (const sql of schemaSql) await query(sql);
  })().catch((error: unknown) => {
    ready = undefined;
    throw error;
  });
  return ready;
}
