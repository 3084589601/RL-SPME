import { ALL_CATEGORIES, RESOURCE_TYPES, formatDuration } from "@/lib/utils";

export type ProfileSession = {
  id: string;
  category: string;
  duration: number;
  date: Date | string;
  note: string | null;
  resource: { id: string; title: string; type: string; category: string } | null;
};

export type ProfileViewLog = {
  id: string;
  duration: number;
  viewedAt: Date | string;
  resource: {
    id: string;
    title: string;
    type: string;
    category: string;
    status: string;
  };
};

export type ProfileProgress = {
  id: string;
  progress: number;
  completed: boolean;
  liked: boolean;
  favorited: boolean;
  viewDuration: number;
  lastViewedAt: Date | string | null;
  resource: {
    id: string;
    title: string;
    type: string;
    category: string;
    status: string;
  };
};

export function buildCategoryStudyStats(sessions: ProfileSession[]) {
  return Object.keys(ALL_CATEGORIES)
    .map((cat) => ({
      category: cat,
      duration: sessions
        .filter((s) => s.category === cat)
        .reduce((sum, s) => sum + s.duration, 0),
    }))
    .filter((s) => s.duration > 0);
}

export function buildTypeViewStats(progressList: ProfileProgress[]) {
  const map = new Map<string, number>();
  for (const p of progressList) {
    if (p.viewDuration <= 0) continue;
    const type = p.resource.type;
    map.set(type, (map.get(type) ?? 0) + p.viewDuration);
  }
  return Array.from(map.entries()).map(([type, duration]) => ({ type, duration }));
}

export function buildResourceStudyStats(sessions: ProfileSession[]) {
  const map = new Map<string, { title: string; duration: number }>();
  for (const s of sessions) {
    if (!s.resource) continue;
    const prev = map.get(s.resource.id);
    map.set(s.resource.id, {
      title: s.resource.title,
      duration: (prev?.duration ?? 0) + s.duration,
    });
  }
  return Array.from(map.values())
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 8);
}

export function calcCompletionRate(progressList: ProfileProgress[], totalResources: number) {
  if (totalResources === 0) return { completed: 0, total: 0, rate: 0 };
  const completed = progressList.filter((p) => p.completed && p.resource.status === "APPROVED").length;
  return {
    completed,
    total: totalResources,
    rate: Math.round((completed / totalResources) * 100),
  };
}

export { formatDuration };
