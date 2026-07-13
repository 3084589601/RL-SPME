import { Award } from "lucide-react";
import { InnerPageLayout, GznuQuickLinks } from "@/components/InnerPageLayout";
import { CertificateGrid, type Certificate } from "@/components/CertificateGrid";
import { ImagePreloads } from "@/components/ImagePreloads";
import { getCachedCertificates } from "@/lib/cached-data";
import manifest from "@/generated/media-manifest.json";
import { homeCertificatesFromManifest } from "@/lib/media";
import { isDisplayableMedia, toThumbUrl } from "@/lib/media-url";

export const revalidate = 300;

function manifestCertificates(): Certificate[] {
  return homeCertificatesFromManifest(manifest.certificates).map((cert) => ({
    id: cert.id,
    title: cert.title,
    description: cert.description,
    imageUrl: cert.imageUrl,
    year: cert.year,
    position: cert.position,
    order: cert.order,
    row: cert.row,
  }));
}

export default async function CertificatesPage() {
  const dbCertificates = await getCachedCertificates();
  const certificateData: Certificate[] =
    dbCertificates.length > 0
      ? dbCertificates.map((cert) => ({
          id: cert.id,
          title: cert.title,
          description: cert.description,
          imageUrl: cert.imageUrl,
          year: cert.year,
          position: cert.position,
          order: cert.order,
          row: cert.row,
        }))
      : manifestCertificates();

  const preloadUrls = certificateData
    .filter((c) => isDisplayableMedia(c.imageUrl))
    .map((c) => toThumbUrl(c.imageUrl));

  return (
    <InnerPageLayout
      title="荣誉证书"
      subtitle="竞赛获奖 · 荣誉成果"
      icon={Award}
      breadcrumbs={[{ label: "荣誉证书" }]}
      sidebar={
        <GznuQuickLinks
          links={[
            { href: "/gallery", label: "作品展示" },
            { href: "/about/competitions", label: "竞赛方向" },
            { href: "/contact", label: "联系我们" },
          ]}
        />
      }
    >
      <ImagePreloads urls={preloadUrls} />
      <CertificateGrid certificates={certificateData} />
    </InnerPageLayout>
  );
}
