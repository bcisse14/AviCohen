import { NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import { z } from "zod";
import { requireAdmin } from "@/lib/cms/auth";
import { apiError, readJson, readLimited, requireSameOrigin } from "@/lib/cms/http";
import { CmsError, repository } from "@/lib/cms/repository";

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
    const bytes = await readLimited(request, 3.5 * 1024 * 1024);
    const form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") || "" } }).formData();
    const file = form.get("file");
    const alt = z.string().trim().min(1).max(500).parse(form.get("alt"));
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
      throw new CmsError(422, "Choisissez une image JPEG, PNG ou WebP de 3 Mo maximum.");
    }
    let image: Buffer;
    let width: number;
    let height: number;
    try {
      const input = sharp(await file.arrayBuffer(), { limitInputPixels: 25000000 });
      const metadata = await input.metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) {
        throw new CmsError(422, "Seuls les fichiers JPEG, PNG et WebP non animés sont acceptés.");
      }
      const output = await input.rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
      image = output.data;
      width = output.info.width;
      height = output.info.height;
    } catch (error) {
      if (error instanceof CmsError) throw error;
      console.warn("Import CMS : image illisible ou dimensions excessives.");
      throw new CmsError(422, "Image illisible ou trop grande (25 mégapixels maximum).");
    }
    const blob = await put(`cms/${crypto.randomUUID()}.webp`, image, {
      access: "public", contentType: "image/webp", addRandomSuffix: true,
    });
    try {
      const media = await repository.addMedia({
        src: blob.url, alt, caption: "", fit: "cover", position: "center", ratio: "landscape",
        name: file.name.slice(0, 200), width, height,
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
    // Keep the file available for existing publications and historical versions.
    await repository.removeMedia(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
