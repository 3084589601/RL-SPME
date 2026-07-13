import { requireMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ResourcesView, ResourceCategorySidebar } from "@/components/ResourcesView";
import { InnerPageLayout, GznuQuickLinks } from "@/components/InnerPageLayout";
import { BookOpen } from "lucide-react";
import { Role } from "@prisma/client";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/Skeleton";
import { RESOURCE_ZONES, parseResourceZone, isTypeInZone } from "@/lib/utils";
import { getZoneTypes, loadResourceTaxonomy } from "@/lib/resource-taxonomy";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; type?: string; q?: string; zone?: string }>;
}) {
  const session = await requireMember();
  const params = await searchParams;
  const isAdmin = session.user.role === Role.ADMIN;
  const zone = parseResourceZone(params.zone);
  const zoneConfig = RESOURCE_ZONES[zone];
  const taxonomy = await loadResourceTaxonomy();
  const zoneTypes = getZoneTypes(zone, taxonomy);
  const competitionTypes = getZoneTypes("competition", taxonomy);
  const examTypes = getZoneTypes("exam", taxonomy);

  const baseWhere: Record<string, unknown> = {};
  if (!isAdmin) {
    baseWhere.status = "APPROVED";
  }

  const where: Record<string, unknown> = {
    ...baseWhere,
    type: { in: zoneTypes },
  };
  if (params.category) where.category = params.category;
  if (params.type && isTypeInZone(params.type, zone, zoneTypes)) {
    where.type = params.type;
  }
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { description: { contains: params.q } },
    ];
  }

  const [resources, zoneCount, competitionCount, examCount, typeGroups] = await Promise.all([
    prisma.resource.findMany({
      where,
      include: {
        author: { select: { name: true } },
        _count: { select: { comments: true, downloadLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.resource.count({ where: { ...baseWhere, type: { in: zoneTypes } } }),
    prisma.resource.count({ where: { ...baseWhere, type: { in: competitionTypes } } }),
    prisma.resource.count({ where: { ...baseWhere, type: { in: examTypes } } }),
    prisma.resource.groupBy({
      by: ["type"],
      where: { ...baseWhere, type: { in: zoneTypes } },
      _count: { _all: true },
    }),
  ]);

  const typeStats = Object.fromEntries(
    typeGroups.map((g) => [g.type, g._count._all]),
  ) as Record<string, number>;
  for (const key of zoneTypes) {
    if (typeStats[key] === undefined) {
      typeStats[key] = 0;
    }
  }

  const sidebarLinks = [
    { href: "/profile", label: "个人中心" },
    { href: "/about/research", label: "研究方向" },
    { href: "/gallery", label: "作品展示" },
    ...(isAdmin ? [{ href: "/admin", label: "后台管理" }] : []),
  ];

  return (
    <InnerPageLayout
      title="学习资源库"
      subtitle={zoneConfig.subtitle}
      icon={BookOpen}
      breadcrumbs={[{ label: "学习资源" }]}
      sidebar={
        <>
          <ResourceCategorySidebar
            currentCategory={params.category || ""}
            currentZone={zone}
            preservedParams={{ type: params.type, q: params.q }}
          />
          <GznuQuickLinks links={sidebarLinks} />
        </>
      }
    >
      <Suspense fallback={<PageSkeleton hero={false} cardGrid />}>
        <ResourcesView
          resources={resources}
          isAdmin={isAdmin}
          userId={session.user.id}
          zone={zone}
          zoneCount={zoneCount}
          competitionCount={competitionCount}
          examCount={examCount}
          typeStats={typeStats}
        />
      </Suspense>
    </InnerPageLayout>
  );
}
