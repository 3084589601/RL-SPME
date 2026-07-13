import { requireMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ResourceDetail } from "@/components/ResourceDetail";
import { InnerPageLayout, VideoPlaylistSidebar } from "@/components/InnerPageLayout";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { parseEpisodeProgress, stableEpisodeId } from "@/lib/episode-progress";
import { isVideoResourceType, loadResourceTaxonomy } from "@/lib/resource-taxonomy";

export async function generateMetadata(): Promise<Metadata> {
  return { referrer: "no-referrer" };
}

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ep?: string }>;
}) {
  const session = await requireMember();
  const { id } = await params;
  const { ep } = await searchParams;
  const isAdmin = session.user.role === Role.ADMIN;

  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      author: { select: { name: true, id: true } },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!resource) notFound();
  if (!isAdmin && resource.status !== "APPROVED") notFound();

  const taxonomy = await loadResourceTaxonomy();
  const isVideoResource = isVideoResourceType(resource.type, taxonomy);

  const interaction = await prisma.resourceProgress.findUnique({
    where: {
      userId_resourceId: { userId: session.user.id, resourceId: id },
    },
  });

  const episodeProgressMap = parseEpisodeProgress(interaction?.episodeProgress);

  let playlistWithProgress: { id: string; title: string; progress: number; completed: boolean }[] = [];
  let showPlaylistSidebar = false;

  if (isVideoResource) {
    if (resource.isPlaylist && resource.playlistItems) {
      try {
        const items = JSON.parse(resource.playlistItems) as {
          id: string;
          title: string;
          videoUrl: string;
        }[];

        playlistWithProgress = items.map((item, idx) => {
          const episodeId = stableEpisodeId(id, idx, item.id);
          const ep = episodeProgressMap[episodeId] ?? episodeProgressMap[item.id];
          return {
            id: episodeId,
            title: item.title || `视频 ${idx + 1}`,
            progress: ep?.progress ?? 0,
            completed: ep?.completed ?? false,
          };
        });

        showPlaylistSidebar = playlistWithProgress.length > 1;
      } catch {
        playlistWithProgress = [];
      }
    } else {
      const playlistItems = await prisma.resource.findMany({
        where: {
          type: resource.type,
          category: resource.category,
          isPlaylist: false,
          ...(isAdmin ? {} : { status: "APPROVED" as const }),
        },
        select: { id: true, title: true, createdAt: true },
        orderBy: [{ createdAt: "asc" }, { title: "asc" }],
      });

      const userProgressList = await prisma.resourceProgress.findMany({
        where: {
          userId: session.user.id,
          resourceId: { in: playlistItems.map((p) => p.id) },
        },
      });

      playlistWithProgress = playlistItems.map((item) => {
        const progress = userProgressList.find((p) => p.resourceId === item.id);
        return {
          id: item.id,
          title: item.title,
          progress: progress?.progress ?? 0,
          completed: progress?.completed ?? false,
        };
      });

      showPlaylistSidebar = playlistWithProgress.length > 1;
    }
  }

  const completedVideos = isVideoResource
    ? playlistWithProgress.filter((p) => p.completed).length
    : 0;
  const totalVideos = isVideoResource ? playlistWithProgress.length : 0;

  const userProgressList =
    isVideoResource && !resource.isPlaylist
      ? await prisma.resourceProgress.findMany({
          where: {
            userId: session.user.id,
            resourceId: { in: playlistWithProgress.map((p) => p.id) },
          },
        })
      : interaction
        ? [interaction]
        : [];

  const totalViewDuration = userProgressList.reduce((sum, p) => sum + p.viewDuration, 0);

  const studySessions = await prisma.studySession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 100,
  });

  const uniqueStudyDays = new Set(
    studySessions.map((s) => new Date(s.date).toDateString()),
  );

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sortedDays = Array.from(uniqueStudyDays)
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    if (sortedDays[i].toDateString() === expectedDate.toDateString()) {
      currentStreak++;
    } else {
      break;
    }
  }

  const learningStats = isVideoResource
    ? {
        totalVideos: Math.max(totalVideos, 1),
        completedVideos,
        totalDuration: totalViewDuration,
        studyDays: uniqueStudyDays.size,
        currentStreak,
        todayCompletedVideos: userProgressList.filter((p) => {
          if (!p.completed || !p.updatedAt) return false;
          const updated = new Date(p.updatedAt);
          updated.setHours(0, 0, 0, 0);
          return updated.getTime() === today.getTime();
        }).length,
        courseComplete: totalVideos > 0 && completedVideos >= totalVideos,
      }
    : undefined;

  const parsedEp = parseInt(ep ?? "0", 10);
  const currentEpIndex =
    resource.isPlaylist && playlistWithProgress.length > 0
      ? Math.min(
          Math.max(Number.isFinite(parsedEp) ? parsedEp : 0, 0),
          playlistWithProgress.length - 1,
        )
      : 0;

  return (
    <InnerPageLayout
      title={isVideoResource ? "在线学习" : "资源详情"}
      subtitle={isVideoResource ? undefined : resource.title}
      icon={FileText}
      breadcrumbs={[
        { label: "学习资源", href: "/resources" },
        { label: resource.title },
      ]}
      sidebar={
        isVideoResource && showPlaylistSidebar ? (
          <VideoPlaylistSidebar
            playlist={playlistWithProgress}
            currentId={id}
            mode={resource.isPlaylist ? "episodes" : "resources"}
            parentResourceId={resource.isPlaylist ? id : undefined}
            currentEpIndex={currentEpIndex}
          />
        ) : undefined
      }
    >
      <ResourceDetail
        resource={resource}
        userId={session.user.id}
        isAdmin={isAdmin}
        interaction={
          interaction
            ? {
                liked: interaction.liked,
                favorited: interaction.favorited,
                progress: interaction.progress,
                completed: interaction.completed,
              }
            : undefined
        }
        episodeProgress={episodeProgressMap}
        playlist={isVideoResource ? playlistWithProgress : []}
        stats={learningStats}
        initialEpIndex={currentEpIndex}
        isVideoResource={isVideoResource}
      />
    </InnerPageLayout>
  );
}
