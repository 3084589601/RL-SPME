import { requireMember } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ProfileCenter } from "@/components/ProfileCenter";
import { InnerPageLayout } from "@/components/InnerPageLayout";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireMember();
  const userId = session.user.id;

  const [user, sessions, viewLogs, progressList, totalResources] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { avatar: true } }),
    prisma.studySession.findMany({
      where: { userId },
      include: {
        resource: { select: { id: true, title: true, type: true, category: true } },
      },
      orderBy: { date: "desc" },
    }),
    prisma.resourceViewLog.findMany({
      where: { userId },
      include: {
        resource: {
          select: { id: true, title: true, type: true, category: true, status: true },
        },
      },
      orderBy: { viewedAt: "desc" },
      take: 100,
    }),
    prisma.resourceProgress.findMany({
      where: { userId },
      include: {
        resource: {
          select: { id: true, title: true, type: true, category: true, status: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.resource.count({ where: { status: "APPROVED" } }),
  ]);

  return (
    <InnerPageLayout
      title="个人中心"
      subtitle="学习统计 · 观看历史 · 喜欢与收藏"
      icon={User}
      breadcrumbs={[{ label: "个人中心" }]}
    >
      <ProfileCenter
        userName={session.user.name}
        userAvatar={user?.avatar ?? null}
        sessions={sessions}
        viewLogs={viewLogs}
        progressList={progressList}
        totalResources={totalResources}
      />
    </InnerPageLayout>
  );
}
