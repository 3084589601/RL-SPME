export type EpisodeProgressEntry = {
  progress: number;
  completed: boolean;
};

export type EpisodeProgressMap = Record<string, EpisodeProgressEntry>;

export function parseEpisodeProgress(raw: string | null | undefined): EpisodeProgressMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as EpisodeProgressMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeEpisodeProgress(
  current: EpisodeProgressMap,
  episodeId: string,
  patch: Partial<EpisodeProgressEntry>,
): EpisodeProgressMap {
  const prev = current[episodeId] ?? { progress: 0, completed: false };
  const progress =
    typeof patch.progress === "number"
      ? Math.min(100, Math.max(0, Math.round(patch.progress)))
      : prev.progress;
  const completed =
    patch.completed !== undefined ? patch.completed : progress >= 100 || prev.completed;
  return {
    ...current,
    [episodeId]: {
      progress: completed ? 100 : progress,
      completed: completed || progress >= 100,
    },
  };
}

export function stableEpisodeId(resourceId: string, index: number, fallbackId?: string) {
  if (fallbackId && fallbackId.startsWith(`${resourceId}-ep-`)) return fallbackId;
  return `${resourceId}-ep-${index}`;
}

export function normalizePlaylistItems(
  resourceId: string,
  items: { id?: string; title: string; videoUrl: string }[],
) {
  return items.map((item, idx) => ({
    id: stableEpisodeId(resourceId, idx, item.id),
    title: item.title.trim() || `Video ${idx + 1}`,
    videoUrl: item.videoUrl.trim(),
  }));
}