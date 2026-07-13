import fs from "fs";
import path from "path";
import type { CarouselSlide } from "@/components/HomeHeroCarousel";
import { sortCertificates } from "@/lib/certificate-layout";
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;

export const CAROUSEL_DIR_NAME = "轮播图片";
export const LOGO_DIR_NAME = "实验室LOGO";
export const CERTIFICATE_DIR_NAME = "荣誉证书";
export const HIGHLIGHTS_DIR_NAME = "精彩瞬间";

export type FolderMediaItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  orientation?: "portrait" | "landscape";
};

function resolveDir(dirName: string): string {
  const candidates = [
    path.join(process.cwd(), dirName),
    path.join(process.cwd(), "public", dirName),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}

function listImages(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => IMAGE_EXT.test(f) && !f.includes("-thumb."));
  const webpBases = new Set(
    files.filter((f) => /\.webp$/i.test(f)).map((f) => fileBaseName(f))
  );
  return files
    .filter((f) => {
      if (/\.webp$/i.test(f)) return true;
      return !webpBases.has(fileBaseName(f));
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function fileBaseName(file: string): string {
  return file.replace(/\.[^.]+$/i, "");
}

function extractYearFromTitle(title: string): number | null {
  const match = title.match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

function publicMediaUrl(dirName: string, file: string): string {
  return `/${dirName}/${file.split(/[/\\]/).pop()}`;
}

function readJpegSize(filePath: string): { width: number; height: number } | null {
  try {
    const buffer = fs.readFileSync(filePath);
    const sof0 = buffer.indexOf(Buffer.from([0xff, 0xc0]));
    const sof2 = buffer.indexOf(Buffer.from([0xff, 0xc2]));
    const offset = sof0 >= 0 ? sof0 : sof2;
    if (offset < 0 || offset + 8 >= buffer.length) return null;
    return {
      height: buffer.readUInt16BE(offset + 5),
      width: buffer.readUInt16BE(offset + 7),
    };
  } catch {
    return null;
  }
}

function imageOrientation(filePath: string): "portrait" | "landscape" {
  const size = readJpegSize(filePath);
  if (!size) return "landscape";
  return size.height > size.width ? "portrait" : "landscape";
}

function getFolderMediaItems(
  dirName: string,
  idPrefix: string,
  withOrientation = false,
  withYearFromTitle = false
): FolderMediaItem[] {
  const dir = resolveDir(dirName);
  const files = listImages(dir);
  return files.map((file, index) => {
    const filePath = path.join(dir, file);
    const title = fileBaseName(file);
    return {
      id: `${idPrefix}-${index}`,
      title,
      description: null,
      imageUrl: publicMediaUrl(dirName, file),
      year: withYearFromTitle ? extractYearFromTitle(title) : null,
      ...(withOrientation ? { orientation: imageOrientation(filePath) } : {}),
    };
  });
}

export function getCertificateItems(): FolderMediaItem[] {
  return getFolderMediaItems(CERTIFICATE_DIR_NAME, "cert", true, true).sort((a, b) => {
    const yearDiff = (b.year ?? 0) - (a.year ?? 0);
    return yearDiff !== 0 ? yearDiff : a.title.localeCompare(b.title, "zh-CN");
  });
}

export type HomeCertificateRecord = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  position: string;
  order: number;
  row: number;
};

function isPlaceholderCertImage(url: string) {
  return !url || url.includes("placeholder");
}

function inferLeftColumn(title: string, imageUrl: string) {
  return title.includes("RoboMaster2026") || imageUrl.includes("RoboMaster2026");
}

export type ManifestCertificate = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
};

export function homeCertificatesFromManifest(items: ManifestCertificate[]): HomeCertificateRecord[] {
  let gridOrder = 0;
  const positioned: HomeCertificateRecord[] = items.map((item) => {
    const isLeft = inferLeftColumn(item.title, item.imageUrl);
    if (isLeft) {
      return {
        ...item,
        row: 0,
        position: "left",
        order: 0,
      };
    }
    const cert: HomeCertificateRecord = {
      ...item,
      row: 0,
      position: "grid",
      order: gridOrder,
    };
    gridOrder += 1;
    return cert;
  });
  return normalizeHomeCertificates(positioned);
}

function certificatesFromFolder(): HomeCertificateRecord[] {
  const items = getCertificateItems();
  if (items.length === 0) return [];

  let gridOrder = 0;
  const result: HomeCertificateRecord[] = items.map((item) => {
    const isLeft = inferLeftColumn(item.title, item.imageUrl);
    if (isLeft) {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        year: item.year,
        row: 0,
        position: "left",
        order: 0,
      };
    }
    const cert: HomeCertificateRecord = {
      id: item.id,
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      year: item.year,
      row: 0,
      position: "grid",
      order: gridOrder,
    };
    gridOrder += 1;
    return cert;
  });

  return normalizeHomeCertificates(result);
}

function normalizeHomeCertificates(items: HomeCertificateRecord[]): HomeCertificateRecord[] {
  if (items.length === 0) return items;

  const hasLeft = items.some((item) => item.position === "left");
  if (!hasLeft) {
    const candidate =
      items.find((item) => inferLeftColumn(item.title, item.imageUrl)) ??
      items.find((item) => item.imageUrl.includes("RoboMaster")) ??
      items[0];
    if (candidate) {
      const adjusted = items.map((item) => {
        if (item.id === candidate.id) {
          return { ...item, row: item.row ?? 0, position: "left", order: 0 };
        }
        if (item.position === "grid") return item;
        return { ...item, position: "grid" };
      });
      return sortCertificates(adjusted);
    }
  }

  return sortCertificates(items);
}

export async function getHomeCertificates(): Promise<HomeCertificateRecord[]> {
  const folderCerts = certificatesFromFolder();

  const { isDatabaseAvailable } = await import("@/lib/db-available");
  if (!isDatabaseAvailable()) {
    return normalizeHomeCertificates(folderCerts);
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const dbCerts = await prisma.certificate.findMany({
      orderBy: [{ row: "asc" }, { position: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        year: true,
        position: true,
        order: true,
        row: true,
      },
    });

    const realDbCerts = dbCerts.filter((cert) => !isPlaceholderCertImage(cert.imageUrl));
    if (realDbCerts.length > 0) {
      return normalizeHomeCertificates(realDbCerts);
    }
  } catch {
    /* fall back to folder media */
  }

  return normalizeHomeCertificates(folderCerts);
}

export function getHighlightItems(): FolderMediaItem[] {
  return getFolderMediaItems(HIGHLIGHTS_DIR_NAME, "highlight");
}

export function getCarouselSlidesFromFolder(): CarouselSlide[] {
  const dir = resolveDir(CAROUSEL_DIR_NAME);
  const files = listImages(dir);
  if (files.length === 0) return [];

  return files.map((file, index) => ({
    id: `carousel-${index}`,
    title: "",
    subtitle: null,
    imageUrl: `/${CAROUSEL_DIR_NAME}/${file.split("/").pop()}`,
    link: null,
  }));
}

/** @deprecated use getHomeCarousel from site-content */
export function getCarouselSlides(): CarouselSlide[] {
  return getCarouselSlidesFromFolder();
}

function getLinkTarget(target: string): string | null {
  try {
    return fs.readlinkSync(target);
  } catch {
    return null;
  }
}

function isExternalPublicLink(target: string): boolean {
  const linkTarget = getLinkTarget(target);
  if (!linkTarget) return false;
  return path.isAbsolute(linkTarget) || /^[a-zA-Z]:[/\\]/.test(linkTarget);
}

function removePublicLink(target: string): void {
  if (!fs.existsSync(target)) return;
  if (getLinkTarget(target)) {
    fs.unlinkSync(target);
    return;
  }
  fs.rmdirSync(target);
}

export function ensurePublicMediaLinks(): void {
  const publicDir = path.join(process.cwd(), "public");
  for (const dirName of [CAROUSEL_DIR_NAME, LOGO_DIR_NAME, CERTIFICATE_DIR_NAME, HIGHLIGHTS_DIR_NAME]) {
    const source = path.join(process.cwd(), dirName);
    const target = path.join(publicDir, dirName);
    if (!fs.existsSync(source)) continue;

    if (fs.existsSync(target)) {
      if (isExternalPublicLink(target)) {
        removePublicLink(target);
      } else {
        continue;
      }
    }

    try {
      fs.cpSync(source, target, { recursive: true });
    } catch {
      /* ignore */
    }
  }
}

function pickLogoFile(files: string[], variant: "cutout" | "white"): string | null {
  if (files.length === 0) return null;

  const whitePatterns = /白底|white[-_]?bg|logo[-_]?white|logo[-_]?bg/i;
  const cutoutPatterns = /抠图|cutout|transparent|logo[-_]?cutout/i;

  const whiteFiles = files.filter((f) => whitePatterns.test(f));
  const cutoutFiles = files.filter((f) => cutoutPatterns.test(f) || !whitePatterns.test(f));

  if (variant === "white") {
    return (
      whiteFiles.find((f) => /^logo/i.test(f)) ??
      whiteFiles[0] ??
      files.find((f) => /^logo/i.test(f)) ??
      files[0]
    );
  }

  return (
    cutoutFiles.find((f) => /^logo\.(png|webp|jpg|jpeg)$/i.test(f)) ??
    cutoutFiles.find((f) => cutoutPatterns.test(f)) ??
    cutoutFiles.find((f) => /^logo/i.test(f) && !whitePatterns.test(f)) ??
    cutoutFiles.find((f) => !whitePatterns.test(f)) ??
    files[0]
  );
}

function logoPublicUrl(fileName: string): string {
  return `/${LOGO_DIR_NAME}/${fileName.split("/").pop()}`;
}

export function getLabLogoUrl(variant: "cutout" | "white" = "cutout"): string | null {
  const dir = resolveDir(LOGO_DIR_NAME);
  const files = listImages(dir);
  const picked = pickLogoFile(files, variant);
  return picked ? logoPublicUrl(picked) : null;
}

/** 顶部导航：抠图透明 LOGO */
export function getLabLogoUrlCutout(): string | null {
  return getLabLogoUrl("cutout");
}

/** 页脚：白底 LOGO */
export function getLabLogoUrlWhite(): string | null {
  return getLabLogoUrl("white");
}
