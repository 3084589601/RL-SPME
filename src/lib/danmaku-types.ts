export type DanmakuMode = "scroll" | "top" | "bottom";

export interface DanmakuItem {
  id: string;
  content: string;
  time: number;
  color: string;
  mode: DanmakuMode;
  user: { id: string; name: string };
}

export interface DanmakuSettings {
  enabled: boolean;
  opacity: number;
  fontSize: number;
  area: number;
  speed: number;
}

export const DANMAKU_COLORS = [
  "#FFFFFF",
  "#FE0302",
  "#FF7204",
  "#FFAA02",
  "#FFD302",
  "#A0EE00",
  "#00CD00",
  "#019899",
  "#4266BE",
  "#89D5FF",
  "#CC0273",
  "#222222",
] as const;

export const DANMAKU_SETTINGS_KEY = "danmaku-settings-v1";

export const DEFAULT_DANMAKU_SETTINGS: DanmakuSettings = {
  enabled: true,
  opacity: 1,
  fontSize: 25,
  area: 0.75,
  speed: 1,
};

export function loadDanmakuSettings(): DanmakuSettings {
  if (typeof window === "undefined") return DEFAULT_DANMAKU_SETTINGS;
  try {
    const raw = localStorage.getItem(DANMAKU_SETTINGS_KEY);
    if (!raw) return DEFAULT_DANMAKU_SETTINGS;
    return { ...DEFAULT_DANMAKU_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_DANMAKU_SETTINGS;
  }
}

export function saveDanmakuSettings(settings: DanmakuSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DANMAKU_SETTINGS_KEY, JSON.stringify(settings));
}