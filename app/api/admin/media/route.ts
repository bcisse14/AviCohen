import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { z } from "zod";
import { requireAdmin } from "@/lib/cms/auth";
import { apiError, readJson, readLimited, requireSameOrigin } from "@/lib/cms/http";
import { CmsError, repository } from "@/lib/cms/repository";
import { normalizeImage } from "@/lib/cms/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    requireAdmin();
    return NextResponse.json(await repository.media(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    requireAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new CmsError(503, "Configurez BLOB_READ_WRITE_TOKEN pour ajouter des images.");
    const bytes = new Uint8Array(await readLimited(request, 3.5 * 1024 * 1024));
    let form: FormData;
    try {
      form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    } catch {
      throw new CmsError(400, "Formulaire d'import invalide.");
    }
    const file = form.get("file");
    const alt = z.string().trim().min(1).max(500).parse(form.get("alt"));
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
      throw new CmsError(422, "Choisissez une image JPEG, PNG ou WebP de 3 Mo maximum.");
    }
    const image = await normalizeImage(await file.arrayBuffer());
    const blob = await put(`cms/${crypto.randomUUID()}.webp`, image.data, {
      access: "public", contentType: "image/webp", addRandomSuffix: true,
    });
    try {
      const media = await repository.addMedia({
        src: blob.url, alt, caption: "", fit: "cover", position: "center", ratio: "landscape",
        name: file.name.slice(0, 200), width: image.width, height: image.height,
      });
      return NextResponse.json(media, { status: 201 });
    } catch (error) {
      try { await del(blob.url); }
      catch (cleanupError) { console.error("Échec du nettoyage de l'image CMS non enregistrée :", cleanupError); }
      throw error;
    }
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    requireSameOrigin(request);
    requireAdmin();
    const body = z.object({ id: z.string().uuid() }).parse(await readJson(request, 4096));
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new CmsError(503, "Configurez BLOB_READ_WRITE_TOKEN pour supprimer les fichiers importés.");
    const revision = await repository.removeMedia(body.id, async (src) => { await del(src); });
    return NextResponse.json({ ok: true, ...revision });
  } catch (error) { return apiError(error); }
}
