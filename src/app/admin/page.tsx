import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/AdminDashboard";
import { InnerPageLayout } from "@/components/InnerPageLayout";
import { getHomeCarousel } from "@/lib/site-content";
import { Settings } from "lucide-react";

export default async function AdminPage() {
  await requireAdmin();

  const [users, pendingResources, allResources, downloadLogs, certificates, galleryItems, siteContent, carouselSlides, invoices] =
    await Promise.all([
      prisma.user.findMany({
        select: { id: true, username: true, name: true, role: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.resource.findMany({
        where: { status: "PENDING" },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.resource.findMany({
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.downloadLog.findMany({
        include: {
          user: { select: { name: true, username: true } },
          resource: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.certificate.findMany({ orderBy: [{ row: "asc" }, { position: "asc" }, { order: "asc" }] }),
      prisma.galleryItem.findMany({ orderBy: [{ order: "asc" }, { year: "desc" }] }),
      prisma.siteContent.findUnique({ where: { key: "lab_intro" } }),
      getHomeCarousel(),
      prisma.invoice.findMany({
        include: { user: { select: { id: true, name: true, username: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <InnerPageLayout
      title="后台管理"
      subtitle="内容管理 · 资源审核 · 用户管理"
      icon={Settings}
      breadcrumbs={[{ label: "后台管理" }]}
    >
      <AdminDashboard
        users={users}
        pendingResources={pendingResources}
        allResources={allResources}
        downloadLogs={downloadLogs}
        certificates={certificates}
        galleryItems={galleryItems}
        siteContent={siteContent?.content || "{}"}
        carouselSlides={carouselSlides}
        invoices={invoices}
      />
    </InnerPageLayout>
  );
}
