import { Bot } from "lucide-react";
import { InnerPageLayout, GznuQuickLinks } from "@/components/InnerPageLayout";
import { GalleryView } from "@/components/GalleryView";
import { ImagePreloads } from "@/components/ImagePreloads";
import { getCachedGalleryItems } from "@/lib/cached-data";
import { isDisplayableMedia, toThumbUrl } from "@/lib/media-url";

export const revalidate = 300;

export default async function GalleryPage() {
  const items = await getCachedGalleryItems();

  const works = items.filter((item) => item.type === "work");
  const members = items.filter((item) => item.type === "member");

  const preloadUrls = [
    ...works.filter((w) => isDisplayableMedia(w.imageUrl)).map((w) => toThumbUrl(w.imageUrl)),
    ...members.filter((m) => isDisplayableMedia(m.imageUrl)).map((m) => toThumbUrl(m.imageUrl)),
  ];

  return (
    <InnerPageLayout
      title="作品展示"
      subtitle="竞赛作品 · 成员风采"
      icon={Bot}
      breadcrumbs={[{ label: "作品展示" }]}
      sidebar={
        <GznuQuickLinks
          links={[
            { href: "/certificates", label: "荣誉证书" },
            { href: "/about/competitions", label: "竞赛方向" },
            { href: "/contact", label: "联系我们" },
          ]}
        />
      }
    >
      <ImagePreloads urls={preloadUrls} />
      <GalleryView members={members} works={works} />
    </InnerPageLayout>
  );
}
