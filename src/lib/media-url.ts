const OPTIMIZED_MEDIA = /^\/(轮播图片|精彩瞬间|荣誉证书|实验室LOGO)\//;

export function isPlaceholderMedia(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  return /placeholder-gallery|placeholder\.svg|\/placeholder[-_]/i.test(url);
}

export function isDisplayableMedia(url: string | null | undefined): url is string {
  return Boolean(url?.trim()) && !isPlaceholderMedia(url);
}

/** 优先加载已生成的 WebP 版本 */
export function toDisplayUrl(url: string): string {
  if (!url?.trim() || isPlaceholderMedia(url)) return url;
  if (/\.webp$/i.test(url)) return url;
  if (OPTIMIZED_MEDIA.test(url)) {
    return url.replace(/\.(jpe?g|png|bmp)$/i, ".webp");
  }
  return url;
}

/** 列表/缩略图用小图，详情用原图 */
export function toThumbUrl(url: string): string {
  if (!url || isPlaceholderMedia(url)) return url;
  if (url.includes("-thumb.")) return url;
  const display = toDisplayUrl(url);
  if (OPTIMIZED_MEDIA.test(display)) {
    return display.replace(/\.webp$/i, "-thumb.webp");
  }
  return url;
}

export function isLocalStaticImage(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}
