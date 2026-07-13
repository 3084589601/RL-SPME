import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TECH_CATEGORIES = {
  EMBEDDED: { label: "嵌入式开发", color: "bg-blue-700" },
  VISION: { label: "视觉算法", color: "bg-blue-500" },
  PCB: { label: "PCB", color: "bg-teal-600" },
  SOLIDWORKS: { label: "SolidWorks", color: "bg-indigo-600" },
  WECHAT_MINI: { label: "微信小程序开发", color: "bg-blue-400" },
  AI_LLM: { label: "AI大模型应用", color: "bg-blue-800" },
  OTHER: { label: "其他", color: "bg-slate-500" },
} as const;

/** 期末・考研・公考备考区专用分类 */
export const EXAM_CATEGORIES = {
  FINAL_EXAM: { label: "期末备考", color: "bg-emerald-600" },
  POSTGRADUATE: { label: "考研", color: "bg-rose-600" },
  CIVIL_SERVICE: { label: "公考", color: "bg-orange-600" },
  OTHER: { label: "其他", color: "bg-slate-500" },
} as const;

export type TechCategoryKey = keyof typeof TECH_CATEGORIES;
export type ExamCategoryKey = keyof typeof EXAM_CATEGORIES;

export function getCategoryMeta(key: string) {
  const tech = TECH_CATEGORIES[key as TechCategoryKey];
  if (tech) return tech;
  const exam = EXAM_CATEGORIES[key as ExamCategoryKey];
  if (exam) return exam;
  return { label: key, color: "bg-slate-500" };
}

export function getCategoriesForZone(zone: ResourceZoneKey) {
  return zone === "exam" ? EXAM_CATEGORIES : TECH_CATEGORIES;
}

export function getCategoryFilterLabel(zone: ResourceZoneKey) {
  return zone === "exam" ? "备考方向" : LEARNING_DIRECTION_LABEL;
}

/** 后台管理等场景下的全部分类 */
export const ALL_CATEGORIES = {
  ...TECH_CATEGORIES,
  FINAL_EXAM: EXAM_CATEGORIES.FINAL_EXAM,
  POSTGRADUATE: EXAM_CATEGORIES.POSTGRADUATE,
  CIVIL_SERVICE: EXAM_CATEGORIES.CIVIL_SERVICE,
} as const;

export type AllCategoryKey = keyof typeof ALL_CATEGORIES;

/** @deprecated 使用 LEARNING_DIRECTIONS，保留别名兼容 */
export const LEARNING_DIRECTIONS = TECH_CATEGORIES;

export const LEARNING_DIRECTION_LABEL = "学习方向";

export const RESOURCE_TYPES = {
  TEMPLATE: { label: "模板例程", icon: "Code" },
  VIDEO: { label: "学习视频", icon: "Video" },
  COURSE_VIDEO: { label: "期末・考研・公考备考视频", icon: "GraduationCap" },
  COMPETITION: { label: "比赛作品", icon: "Trophy" },
} as const;

export type ResourceTypeKey = keyof typeof RESOURCE_TYPES;

export function getResourceTypeLabel(
  type: string,
  extra?: Record<string, { label: string }>,
): string {
  return extra?.[type]?.label ?? RESOURCE_TYPES[type as ResourceTypeKey]?.label ?? type;
}

/** 上传/展示用资源类型说明 */
export const RESOURCE_TYPE_SUMMARY = "备赛学习 · 期末・考研・公考备考";

export const RESOURCE_ZONES = {
  competition: {
    key: "competition",
    label: "备赛学习区",
    subtitle: "模板例程 · 学习视频 · 比赛作品",
    description: "竞赛备赛相关的模板、视频与作品",
    types: ["TEMPLATE", "VIDEO", "COMPETITION"] as const satisfies readonly ResourceTypeKey[],
  },
  exam: {
    key: "exam",
    label: "期末・考研・公考备考区",
    subtitle: "期末 · 考研 · 公考备考视频",
    description: "期末复习、考研与公考相关的系统化备考视频",
    types: ["COURSE_VIDEO"] as const satisfies readonly ResourceTypeKey[],
  },
} as const;

export type ResourceZoneKey = keyof typeof RESOURCE_ZONES;

export const COMPETITION_RESOURCE_TYPES = RESOURCE_ZONES.competition.types;
export const EXAM_RESOURCE_TYPES = RESOURCE_ZONES.exam.types;

export function parseResourceZone(value?: string | null): ResourceZoneKey {
  return value === "exam" ? "exam" : "competition";
}

export function getResourceZone(type: ResourceTypeKey): ResourceZoneKey {
  return type === "COURSE_VIDEO" ? "exam" : "competition";
}

export function isTypeInZone(type: string, zone: ResourceZoneKey, extraTypes?: string[]): boolean {
  const allowed = extraTypes ?? [...RESOURCE_ZONES[zone].types];
  return allowed.includes(type);
}

/** 备赛学习区顶部统计卡片 */
export const RESOURCE_STAT_CARDS = [
  { type: "TEMPLATE", label: "模板例程" },
  { type: "VIDEO", label: "学习视频" },
  { type: "COMPETITION", label: "比赛作品" },
] as const;

/** 备考区顶部统计卡片 */
export const EXAM_STAT_CARDS = [{ type: "COURSE_VIDEO", label: "备考视频" }] as const;

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isPreviewableFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ["c", "h", "cpp", "py", "js", "ts", "tsx", "jsx", "json", "md", "txt", "xml", "html", "css"].includes(ext);
}

export function getFileLanguage(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    c: "c", h: "c", cpp: "cpp", py: "python", js: "javascript",
    ts: "typescript", tsx: "typescript", jsx: "javascript",
    json: "json", md: "markdown", txt: "text", xml: "xml",
    html: "html", css: "css",
  };
  return map[ext] || "text";
}
