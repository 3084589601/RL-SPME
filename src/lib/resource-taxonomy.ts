import { prisma } from "@/lib/prisma";
import {
  EXAM_CATEGORIES,
  RESOURCE_TYPES,
  RESOURCE_ZONES,
  TECH_CATEGORIES,
  type ResourceZoneKey,
} from "@/lib/utils";

export const RESOURCE_TAXONOMY_KEY = "resource_taxonomy";

export interface CustomTypeEntry {
  key: string;
  label: string;
  zone: ResourceZoneKey;
  icon?: string;
  /** 继承内置类型的表单与展示行为 */
  behavior?: "VIDEO" | "COURSE_VIDEO" | "TEMPLATE" | "COMPETITION";
}

export interface CustomCategoryEntry {
  key: string;
  label: string;
  zone: ResourceZoneKey;
  color?: string;
}

export interface ResourceTaxonomy {
  customTypes: CustomTypeEntry[];
  customCategories: CustomCategoryEntry[];
}

export const EMPTY_TAXONOMY: ResourceTaxonomy = {
  customTypes: [],
  customCategories: [],
};

export function createTaxonomyKey(label: string): string {
  const normalized = label
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
  const base = (normalized || `item_${Date.now()}`).slice(0, 32).toUpperCase();
  return `CUSTOM_${base}`;
}

export function parseResourceTaxonomy(raw: string | null | undefined): ResourceTaxonomy {
  if (!raw) return { ...EMPTY_TAXONOMY };
  try {
    const parsed = JSON.parse(raw) as Partial<ResourceTaxonomy>;
    return {
      customTypes: Array.isArray(parsed.customTypes) ? parsed.customTypes : [],
      customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
    };
  } catch {
    return { ...EMPTY_TAXONOMY };
  }
}

export async function loadResourceTaxonomy(): Promise<ResourceTaxonomy> {
  const row = await prisma.siteContent.findUnique({ where: { key: RESOURCE_TAXONOMY_KEY } });
  return parseResourceTaxonomy(row?.content);
}

export async function saveResourceTaxonomy(taxonomy: ResourceTaxonomy): Promise<void> {
  await prisma.siteContent.upsert({
    where: { key: RESOURCE_TAXONOMY_KEY },
    update: { content: JSON.stringify(taxonomy) },
    create: {
      key: RESOURCE_TAXONOMY_KEY,
      title: "Resource taxonomy",
      content: JSON.stringify(taxonomy),
    },
  });
}

export function mergeResourceTypes(taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY) {
  const merged: Record<string, { label: string; icon?: string }> = { ...RESOURCE_TYPES };
  for (const item of taxonomy.customTypes) {
    merged[item.key] = { label: item.label, icon: item.icon || "File" };
  }
  return merged;
}

export function mergeCategoriesForZone(
  zone: ResourceZoneKey,
  taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY,
) {
  const base =
    zone === "exam"
      ? { ...EXAM_CATEGORIES }
      : { ...TECH_CATEGORIES };
  for (const item of taxonomy.customCategories) {
    if (item.zone === zone) {
      base[item.key as keyof typeof base] = {
        label: item.label,
        color: item.color || "bg-slate-500",
      } as (typeof base)[keyof typeof base];
    }
  }
  return base as Record<string, { label: string; color: string }>;
}

export function getZoneTypes(
  zone: ResourceZoneKey,
  taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY,
): string[] {
  const builtIn = [...RESOURCE_ZONES[zone].types];
  const custom = taxonomy.customTypes
    .filter((item) => item.zone === zone)
    .map((item) => item.key);
  return [...builtIn, ...custom];
}

export function getTypeBehavior(
  type: string,
  taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY,
): "VIDEO" | "COURSE_VIDEO" | "TEMPLATE" | "COMPETITION" | string {
  if (type in RESOURCE_TYPES) return type;
  const custom = taxonomy.customTypes.find((item) => item.key === type);
  if (custom?.behavior) return custom.behavior;
  const zone = getResourceZoneForType(type, taxonomy);
  return zone === "exam" ? "COURSE_VIDEO" : "VIDEO";
}

export function isVideoResourceType(type: string, taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY) {
  const behavior = getTypeBehavior(type, taxonomy);
  return behavior === "VIDEO" || behavior === "COURSE_VIDEO";
}

export function isTemplateResourceType(type: string, taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY) {
  return getTypeBehavior(type, taxonomy) === "TEMPLATE";
}

export function getResourceZoneForType(
  type: string,
  taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY,
): ResourceZoneKey {
  const custom = taxonomy.customTypes.find((item) => item.key === type);
  if (custom) return custom.zone;
  return type === "COURSE_VIDEO" ? "exam" : "competition";
}

export function isKnownResourceType(type: string, taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY) {
  return Boolean(mergeResourceTypes(taxonomy)[type]);
}

export function isKnownCategory(
  category: string,
  zone: ResourceZoneKey,
  taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY,
) {
  return Boolean(mergeCategoriesForZone(zone, taxonomy)[category]);
}

export function getCategoryMetaFromTaxonomy(
  key: string,
  taxonomy: ResourceTaxonomy = EMPTY_TAXONOMY,
) {
  const competition = mergeCategoriesForZone("competition", taxonomy)[key];
  if (competition) return competition;
  const exam = mergeCategoriesForZone("exam", taxonomy)[key];
  if (exam) return exam;
  return { label: key, color: "bg-slate-500" };
}