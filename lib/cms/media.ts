import sharp from "sharp";
import { CmsError } from "./repository";

export async function normalizeImage(bytes: ArrayBuffer) {
  try {
    const input = sharp(bytes, { limitInputPixels: 25000000 });
    const metadata = await input.metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) {
      throw new CmsError(422, "Seuls les fichiers JPEG, PNG et WebP non animés sont acceptés.");
    }
    const output = await input.rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    return { data: output.data, width: output.info.width, height: output.info.height };
  } catch (error) {
    if (error instanceof CmsError) throw error;
    console.warn("Import CMS : image illisible ou dimensions excessives.");
    throw new CmsError(422, "Image illisible ou trop grande (25 mégapixels maximum).");
  }
}
