import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { query, ensureDatabase } from "./database";
import { CmsError } from "./repository";

const scryptAsync = promisify(scrypt);
export const sessionCookie = "cohen_cms_session";
export const sessionSeconds = 8 * 60 * 60;
const hashPattern = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/;
export function configurationIssues() {
  const issues = ["DATABASE_URL", "CMS_ADMIN_EMAIL", "CMS_ADMIN_PASSWORD_HASH", "CMS_SESSION_SECRET"]
    .filter((key) => !process.env[key]);
  if (process.env.CMS_SESSION_SECRET && process.env.CMS_SESSION_SECRET.length < 48) issues.push("CMS_SESSION_SECRET (48 caractères minimum)");
  if (process.env.CMS_ADMIN_PASSWORD_HASH && !hashPattern.test(process.env.CMS_ADMIN_PASSWORD_HASH)) issues.push("CMS_ADMIN_PASSWORD_HASH (empreinte scrypt invalide)");
  if (process.env.CMS_ADMIN_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.CMS_ADMIN_EMAIL)) issues.push("CMS_ADMIN_EMAIL (adresse e-mail invalide)");
  return issues;
}
function secret(): string {
  const value = process.env.CMS_SESSION_SECRET;
  if (!value || value.length < 48) throw new CmsError(503, "CMS_SESSION_SECRET doit contenir au moins 48 caractères.");
  return value;
}
function credentialFingerprint() {
  return createHash("sha256").update(`${process.env.CMS_ADMIN_EMAIL}:${process.env.CMS_ADMIN_PASSWORD_HASH}`).digest("hex");
}
export function signSession(now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    exp: now + sessionSeconds * 1000, user: credentialFingerprint(), nonce: randomBytes(16).toString("hex"),
  })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
export function verifySession(token: string | undefined, now = Date.now()): boolean {
  if (!token || token.length > 1000 || configurationIssues().length) return false;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof parsed !== "object" || parsed === null || !("exp" in parsed) || !("user" in parsed)) return false;
    return typeof parsed.exp === "number" && parsed.exp > now && parsed.user === credentialFingerprint();
  } catch {
    return false;
  }
}
export function isAuthenticated() {
  return verifySession(cookies().get(sessionCookie)?.value);
}
export function requireAdmin() {
  if (!isAuthenticated()) throw new CmsError(401, "Votre session a expiré. Reconnectez-vous ; vos modifications restent dans cette fenêtre.");
}
export async function checkCredentials(email: string, password: string) {
  if (configurationIssues().length) throw new CmsError(503, "L'administration n'est pas encore correctement configurée.");
  secret();
  const configuredHash = process.env.CMS_ADMIN_PASSWORD_HASH || "";
  const match = hashPattern.exec(configuredHash);
  if (!match?.[1] || !match[2]) throw new CmsError(503, "Le mot de passe administrateur est mal configuré. Exécutez npm run cms:password.");
  await ensureDatabase();
  // A shared database limit remains effective across serverless instances.
  const rows = await query<{ attempts: number } & Record<string, unknown>>(
    `INSERT INTO cms_login_attempts (key, attempts, window_start) VALUES ('admin', 1, now())
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN cms_login_attempts.window_start < now() - interval '15 minutes' THEN 1 ELSE cms_login_attempts.attempts + 1 END,
      window_start = CASE WHEN cms_login_attempts.window_start < now() - interval '15 minutes' THEN now() ELSE cms_login_attempts.window_start END
    RETURNING attempts`,
  );
  if (!rows[0] || rows[0].attempts > 30) throw new CmsError(429, "Trop de tentatives de connexion. Réessayez dans 15 minutes.");
  const actual = await scryptAsync(password, match[1], 64) as Buffer;
  const validPassword = timingSafeEqual(actual, Buffer.from(match[2], "hex"));
  const validEmail = email.trim().toLowerCase() === process.env.CMS_ADMIN_EMAIL?.trim().toLowerCase();
  if (!validPassword || !validEmail) throw new CmsError(401, "Identifiants incorrects.");
}
