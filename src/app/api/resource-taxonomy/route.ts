import { NextResponse } from "next/server";
import { loadResourceTaxonomy, mergeCategoriesForZone, mergeResourceTypes, getZoneTypes } from "@/lib/resource-taxonomy";
import { RESOURCE_ZONES, type ResourceZoneKey } from "@/lib/utils";

export async function GET() {
  const taxonomy = await loadResourceTaxonomy();
  const zones = (Object.keys(RESOURCE_ZONES) as ResourceZoneKey[]).reduce(
    (acc, zone) => {
      acc[zone] = {
        types: getZoneTypes(zone, taxonomy),
        categories: mergeCategoriesForZone(zone, taxonomy),
      };
      return acc;
    },
    {} as Record<ResourceZoneKey, { types: string[]; categories: Record<string, { label: string; color: string }> }>,
  );

  return NextResponse.json({
    taxonomy,
    types: mergeResourceTypes(taxonomy),
    zones,
  });
}