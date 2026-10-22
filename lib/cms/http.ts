import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { CmsError } from "./repository";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) throw new CmsError(403, "Origine de la requête non autorisée.");
}
export async function readLimited(request: Request, limit: number): Promise<Uint8Array> {
  if (Number(request.headers.get("content-length")) > limit) throw new CmsError(413, "Le contenu est trop volumineux.");
  const reader = request.body?.getReader();
  if (!reader) throw new CmsError(400, "Corps de requête manquant.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new CmsError(413, "Le contenu est trop volumineux.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
export async function readJson(request: Request, limit = 2 * 1024 * 1024): Promise<unknown> {
  const body = await readLimited(request, limit);
  try {
    return JSON.parse(Buffer.from(body).toString("utf8"));
  } catch {
    throw new CmsError(400, "JSON invalide.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof CmsError) return NextResponse.json({ message: error.message }, { status: error.status });
  if (error instanceof ZodError) {
    return NextResponse.json({
      message: error.issues.map((issue) => `${issue.path.join(".")} : ${issue.message}`).join("\n"),
    }, { status: 422 });
  }
  console.error("Erreur CMS :", error);
  return NextResponse.json({ message: "Le CMS a rencontré une erreur. Vos modifications ne sont pas confirmées ; réessayez sans fermer cette fenêtre." }, { status: 500 });
}
