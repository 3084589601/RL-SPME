import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]);
const VIDEO_EXT = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const RASTER_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);
const SKIP_OPTIMIZE_EXT = new Set([".svg", ".gif"]);

export type ImageProfile = "hero" | "content" | "thumb";

const MAX_WIDTH: Record<ImageProfile, number> = {
  hero: 3840,    // 4K 超清轮播（不限制放大）
  content: 1920,  // 正文插图
  thumb: 640,     // 缩略图
};

const WEBP_QUALITY: Record<ImageProfile, number> = {
  hero: 95,       // 轮播图接近无损
  content: 85,
  thumb: 75,
};

const THUMB_WIDTH = 640;

export function isImageFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return IMAGE_EXT.has(ext);
}

export function isVideoFile(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return VIDEO_EXT.has(ext);
}

export async function optimizeImageBuffer(
  buffer: Buffer,
  profile: ImageProfile = "content"
): Promise<{ buffer: Buffer; ext: string }> {
  const maxWidth = MAX_WIDTH[profile];
  const quality = WEBP_QUALITY[profile];
  // hero 允许放大以保证 4K，其他 profile 不放大
  const noEnlarge = profile !== "hero";
  try {
    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: noEnlarge })
      .webp({ quality, effort: 4 })
      .toBuffer();
    return { buffer: optimized, ext: ".webp" };
  } catch {
    return { buffer, ext: "" };
  }
}

function safeBaseName(name: string): string {
  return `${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
}

export async function saveUploadedFile(
  file: File,
  subdir: "uploads" | "public-uploads" = "uploads",
  profile: ImageProfile = "content"
): Promise<{ url: string; filename: string }> {
  const ext = path.extname(file.name).toLowerCase();
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  let outExt = ext || ".jpg";

  if (RASTER_EXT.has(ext) && !SKIP_OPTIMIZE_EXT.has(ext)) {
    const optimized = await optimizeImageBuffer(buffer, profile);
    buffer = Buffer.from(optimized.buffer);
    outExt = optimized.ext || ext;
  }

  const safeName = safeBaseName(file.name).replace(/\.[^.]+$/, "") + outExt;

  if (subdir === "public-uploads") {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, safeName), buffer);

    if (outExt === ".webp" && RASTER_EXT.has(ext)) {
      try {
        const thumbBuf = await sharp(buffer)
          .resize({ width: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 75, effort: 2 })
          .toBuffer();
        const thumbName = safeName.replace(/\.webp$/i, "-thumb.webp");
        await writeFile(path.join(dir, thumbName), thumbBuf);
      } catch {
        /* optional thumb */
      }
    }

    return { url: `/uploads/${safeName}`, filename: safeName };
  }

  const dir = path.join(process.cwd(), "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), buffer);
  return { url: safeName, filename: safeName };
}

export async function savePublicImage(file: File, profile: ImageProfile = "content") {
  return saveUploadedFile(file, "public-uploads", profile);
}

export async function saveInvoiceFile(file: File): Promise<{ url: string; filename: string; fileSize: number }> {
  const ext = path.extname(file.name).toLowerCase();
  if (ext !== ".pdf") throw new Error("只接受 PDF 文件");

  const safeName = `invoice-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "uploads", "invoices");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), buffer);
  return { url: safeName, filename: safeName, fileSize: buffer.length };
}

export async function savePublicVideo(file: File): Promise<{ url: string; filename: string }> {
  const safeName = safeBaseName(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads", "videos");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), buffer);
  return { url: `/uploads/videos/${safeName}`, filename: safeName };
}
