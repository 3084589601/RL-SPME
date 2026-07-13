import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessResources } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canAccessResources(session.user.role)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const { resourceId, duration } = await req.json();
  if (!resourceId) {
    return NextResponse.json({ error: "无效参数" }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

  const extraDuration = Math.min(Math.max(Number(duration) || 0, 0), 86400);

  await prisma.$transaction([
    prisma.resourceViewLog.create({
      data: {
        userId: session.user.id,
        resourceId,
        duration: extraDuration,
      },
    }),
    prisma.resourceProgress.upsert({
      where: {
        userId_resourceId: { userId: session.user.id, resourceId },
      },
      create: {
        userId: session.user.id,
        resourceId,
        lastViewedAt: new Date(),
        viewDuration: extraDuration,
      },
      update: {
        lastViewedAt: new Date(),
        viewDuration: { increment: extraDuration },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
