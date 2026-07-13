import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessResources } from "@/lib/permissions";
import {
  mergeEpisodeProgress,
  parseEpisodeProgress,
} from "@/lib/episode-progress";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: resourceId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !canAccessResources(session.user.role)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const record = await prisma.resourceProgress.findUnique({
    where: {
      userId_resourceId: { userId: session.user.id, resourceId },
    },
  });

  return NextResponse.json(
    record ?? {
      liked: false,
      favorited: false,
      progress: 0,
      completed: false,
      episodeProgress: "{}",
    },
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: resourceId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !canAccessResources(session.user.role)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

  const body = await req.json();
  const existing = await prisma.resourceProgress.findUnique({
    where: {
      userId_resourceId: { userId: session.user.id, resourceId },
    },
  });

  const data: {
    liked?: boolean;
    favorited?: boolean;
    progress?: number;
    completed?: boolean;
    episodeProgress?: string;
    lastViewedAt?: Date;
  } = { lastViewedAt: new Date() };

  if (typeof body.liked === "boolean") data.liked = body.liked;
  if (typeof body.favorited === "boolean") data.favorited = body.favorited;

  if (typeof body.episodeId === "string" && body.episodeId) {
    const episodeMap = mergeEpisodeProgress(
      parseEpisodeProgress(existing?.episodeProgress),
      body.episodeId,
      {
        progress: typeof body.progress === "number" ? body.progress : undefined,
        completed: typeof body.completed === "boolean" ? body.completed : undefined,
      },
    );
    data.episodeProgress = JSON.stringify(episodeMap);

    if (resource.isPlaylist && resource.playlistItems) {
      try {
        const items = JSON.parse(resource.playlistItems) as { id: string }[];
        const completedCount = items.filter((item) => episodeMap[item.id]?.completed).length;
        const avgProgress = items.length
          ? Math.round(
              items.reduce((sum, item) => sum + (episodeMap[item.id]?.progress ?? 0), 0) /
                items.length,
            )
          : 0;
        data.progress = avgProgress;
        data.completed = items.length > 0 && completedCount >= items.length;
      } catch {
        /* ignore malformed playlist */
      }
    }
  } else {
    if (typeof body.progress === "number") {
      data.progress = Math.min(100, Math.max(0, Math.round(body.progress)));
      if (data.progress >= 100) data.completed = true;
    }
    if (typeof body.completed === "boolean") {
      data.completed = body.completed;
      if (body.completed) data.progress = 100;
    }
  }

  const record = await prisma.resourceProgress.upsert({
    where: {
      userId_resourceId: { userId: session.user.id, resourceId },
    },
    create: {
      userId: session.user.id,
      resourceId,
      liked: data.liked ?? false,
      favorited: data.favorited ?? false,
      progress: data.progress ?? 0,
      completed: data.completed ?? false,
      episodeProgress: data.episodeProgress ?? "{}",
      lastViewedAt: new Date(),
    },
    update: data,
  });

  return NextResponse.json(record);
}
