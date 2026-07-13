export function basenameWithoutExt(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export function extractLeadingNumber(filename: string): number | null {
  const base = basenameWithoutExt(filename);
  const match = base.match(/^(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function titleFromVideoFilename(filename: string): string {
  return basenameWithoutExt(filename);
}

export function sortVideoFilesByLeadingNumber(files: File[]): File[] {
  return [...files].sort((a, b) => {
    const na = extractLeadingNumber(a.name);
    const nb = extractLeadingNumber(b.name);
    if (na !== null && nb !== null && na !== nb) return na - nb;
    if (na !== null && nb === null) return -1;
    if (na === null && nb !== null) return 1;
    return a.name.localeCompare(b.name, "zh-CN", { numeric: true });
  });
}

export function isVideoLikeFile(file: File): boolean {
  return /\.(mp4|webm|mov|m4v|mkv|avi)$/i.test(file.name);
}