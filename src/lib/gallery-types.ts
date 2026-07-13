import { isPlaceholderMedia } from "@/lib/media-url";

export type GalleryMember = {
  name: string;
  role?: string;
  photoUrl?: string;
};

export type WorkHighlights = {
  demoVideo: string | null;
  momentImages: (string | null)[];
};

export type WorkDetailData = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  teamName: string | null;
  teamPhotoUrl: string | null;
  members: GalleryMember[];
  highlights: WorkHighlights;
};

const MOMENT_SLOTS = 6;

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function emptyHighlights(): WorkHighlights {
  return { demoVideo: null, momentImages: Array(MOMENT_SLOTS).fill(null) };
}

function normalizeMomentImages(urls: unknown[]): (string | null)[] {
  const slots: (string | null)[] = Array(MOMENT_SLOTS).fill(null);

  for (let i = 0; i < MOMENT_SLOTS; i++) {
    const item = urls[i];
    if (typeof item === "string" && item.trim()) {
      const url = item.trim();
      slots[i] = isPlaceholderMedia(url) ? null : url;
      continue;
    }
    if (item && typeof item === "object" && "url" in item) {
      const url = String((item as { url: string }).url).trim();
      if (url && !isPlaceholderMedia(url)) slots[i] = url;
    }
  }

  // 兼容旧数据：纯 URL 数组按顺序填入空位
  if (slots.every((slot) => !slot)) {
    const legacy = urls
      .map((item) => {
        if (typeof item === "string") return item.trim() || null;
        if (item && typeof item === "object" && "url" in item) {
          return String((item as { url: string }).url).trim() || null;
        }
        return null;
      })
      .filter((url): url is string => Boolean(url) && !isPlaceholderMedia(url));

    legacy.slice(0, MOMENT_SLOTS).forEach((url, i) => {
      slots[i] = url;
    });
  }

  return slots;
}

export function parseWorkHighlights(raw: string | null | undefined): WorkHighlights {
  if (!raw) return emptyHighlights();

  const data = parseJson<unknown>(raw, null);
  if (!data) return emptyHighlights();

  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const record = data as { demoVideo?: string | null; momentImages?: unknown[] };
    return {
      demoVideo: record.demoVideo ?? null,
      momentImages: normalizeMomentImages(record.momentImages ?? []),
    };
  }

  if (Array.isArray(data)) {
    const legacy = data as Array<{ type?: string; url?: string }>;
    const demoVideo = legacy.find((item) => item.type === "video")?.url ?? null;
    const images = legacy
      .filter((item) => item.type === "image" && item.url)
      .map((item) => item.url as string);
    return { demoVideo, momentImages: normalizeMomentImages(images) };
  }

  return emptyHighlights();
}

export function parseGalleryMembers(raw: string | null | undefined): GalleryMember[] {
  return parseJson<GalleryMember[]>(raw, []);
}

export function toWorkDetail(item: {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  teamName: string | null;
  teamPhotoUrl: string | null;
  membersJson: string | null;
  highlightsJson: string | null;
}): WorkDetailData {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    year: item.year,
    teamName: item.teamName,
    teamPhotoUrl: item.teamPhotoUrl,
    members: parseGalleryMembers(item.membersJson),
    highlights: parseWorkHighlights(item.highlightsJson),
  };
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export type VideoEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "native"; src: string };

const NATIVE_VIDEO = /\.(mp4|webm|mov|m4v)(\?|$)/i;

export function resolveVideoEmbed(url: string | null | undefined): VideoEmbed | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/videos/") || NATIVE_VIDEO.test(trimmed)) {
    return { kind: "native", src: trimmed };
  }
  const yt = youtubeEmbedUrl(trimmed);
  if (yt) return { kind: "iframe", src: yt };
  if (/^https?:\/\//i.test(trimmed)) return { kind: "iframe", src: trimmed };
  return null;
}

export function buildHighlightsJson(demoVideo: string, momentImages: string[]): string {
  const images = Array.from({ length: MOMENT_SLOTS }, (_, i) => momentImages[i] ?? null);
  return JSON.stringify({ demoVideo, momentImages: images });
}