import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  createTaxonomyKey,
  loadResourceTaxonomy,
  mergeCategoriesForZone,
  mergeResourceTypes,
  saveResourceTaxonomy,
  type CustomCategoryEntry,
  type CustomTypeEntry,
} from "@/lib/resource-taxonomy";
import { RESOURCE_ZONES, type ResourceZoneKey } from "@/lib/utils";

export async function GET() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const taxonomy = await loadResourceTaxonomy();
  return NextResponse.json(taxonomy);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const kind = body.kind as "type" | "category";
  const label = String(body.label ?? "").trim();
  const zone = body.zone as ResourceZoneKey;
  const behavior = body.behavior as CustomTypeEntry["behavior"] | undefined;

  if (!label) {
    return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
  }
  if (zone !== "competition" && zone !== "exam") {
    return NextResponse.json({ error: "无效分区" }, { status: 400 });
  }
  if (kind !== "type" && kind !== "category") {
    return NextResponse.json({ error: "无效类型" }, { status: 400 });
  }

  const taxonomy = await loadResourceTaxonomy();
  const key = createTaxonomyKey(label);

  if (kind === "type") {
    const builtIn = RESOURCE_ZONES[zone].types as readonly string[];
    const merged = mergeResourceTypes(taxonomy);
    const labelExists = Object.values(merged).some((item) => item.label === label);
    const exists =
      builtIn.includes(key) ||
      taxonomy.customTypes.some((item) => item.label === label || item.key === key) ||
      labelExists;
    if (exists) {
      return NextResponse.json({ error: "该资源类型已存在" }, { status: 400 });
    }

    const defaultBehavior: CustomTypeEntry["behavior"] =
      zone === "exam" ? "COURSE_VIDEO" : "VIDEO";
    const entry: CustomTypeEntry = {
      key,
      label,
      zone,
      behavior: behavior || defaultBehavior,
    };
    taxonomy.customTypes.push(entry);
    await saveResourceTaxonomy(taxonomy);
    return NextResponse.json(entry);
  }

  const zoneCategories = mergeCategoriesForZone(zone, taxonomy);
  const labelExists = Object.values(zoneCategories).some((item) => item.label === label);
  if (
    labelExists ||
    taxonomy.customCategories.some(
      (item) => item.zone === zone && (item.label === label || item.key === key),
    )
  ) {
    return NextResponse.json({ error: "该方向已存在" }, { status: 400 });
  }

  const entry: CustomCategoryEntry = { key, label, zone, color: "bg-slate-500" };
  taxonomy.customCategories.push(entry);
  await saveResourceTaxonomy(taxonomy);
  return NextResponse.json(entry);
}
