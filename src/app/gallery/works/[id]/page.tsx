import { Bot } from "lucide-react";
import { notFound } from "next/navigation";
import { InnerPageLayout, GznuQuickLinks } from "@/components/InnerPageLayout";
import { WorkDetail } from "@/components/WorkDetail";
import { ImagePreloads } from "@/components/ImagePreloads";
import { prisma } from "@/lib/prisma";
import { toWorkDetail } from "@/lib/gallery-types";
import { isDisplayableMedia, toDisplayUrl } from "@/lib/media-url";

export const revalidate = 300;

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.galleryItem.findUnique({ where: { id } });

  if (!item || item.type !== "work") notFound();

  const work = toWorkDetail(item);

  const preloadUrls: string[] = [];
  if (isDisplayableMedia(work.imageUrl)) preloadUrls.push(toDisplayUrl(work.imageUrl));
  if (isDisplayableMedia(work.teamPhotoUrl)) preloadUrls.push(toDisplayUrl(work.teamPhotoUrl));
  work.members.forEach((m) => {
    if (isDisplayableMedia(m.photoUrl)) preloadUrls.push(m.photoUrl!);
  });
  work.highlights.momentImages.forEach((u) => {
    if (isDisplayableMedia(u)) preloadUrls.push(u!);
  });

  return (
    <InnerPageLayout
      title="作品详情"
      subtitle={work.title}
      icon={Bot}
      breadcrumbs={[
        { label: "作品展示", href: "/gallery" },
        { label: work.title },
      ]}
      sidebar={
        <GznuQuickLinks
          links={[
            { href: "/gallery", label: "返回作品展示" },
            { href: "/certificates", label: "荣誉证书" },
            { href: "/about/competitions", label: "竞赛方向" },
            { href: "/contact", label: "联系我们" },
          ]}
        />
      }
    >
      <ImagePreloads urls={preloadUrls} />
      <WorkDetail work={work} />
    </InnerPageLayout>
  );
}