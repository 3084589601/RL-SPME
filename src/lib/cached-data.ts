import { unstable_cache } from "next/cache";
import { getHomeCertificates, homeCertificatesFromManifest, type HomeCertificateRecord } from "@/lib/media";
import { getHomeCarousel, getLabIntro, type CarouselSlideData, type LabIntroContent } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";
import { withDatabase } from "@/lib/safe-database";
import { PUBLIC_REVALIDATE } from "@/lib/cache-config";
import manifest from "@/generated/media-manifest.json";

export function getStaticLabLogos() {
  return { cutout: manifest.logoCutout, white: manifest.logoWhite };
}

export const getCachedLabLogos = async () => getStaticLabLogos();

export const getCachedHighlightItems = async () => manifest.highlights;

export const getCachedHomeCertificates = unstable_cache(
  async (): Promise<HomeCertificateRecord[]> => {
    const folderCerts = homeCertificatesFromManifest(manifest.certificates);
    return getHomeCertificates().catch(() => folderCerts);
  },
  ["home-certificates"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["home-certificates"] }
);

export const getCachedHomeCarousel = unstable_cache(
  async (): Promise<CarouselSlideData[]> => getHomeCarousel(),
  ["home-carousel"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["home-carousel"] }
);

export const getCachedLabIntro = unstable_cache(
  async (): Promise<LabIntroContent> => getLabIntro(),
  ["lab-intro"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["lab-intro"] }
);

export const getCachedGalleryItems = unstable_cache(
  async () =>
    withDatabase([], () =>
      prisma.galleryItem.findMany({
        orderBy: [{ order: "asc" }, { year: "desc" }, { createdAt: "desc" }],
      })
    ),
  ["gallery-items-v2"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["gallery-items"] }
);

export const getCachedCertificates = unstable_cache(
  async () =>
    withDatabase([], () => prisma.certificate.findMany({ orderBy: [{ row: "asc" }, { position: "asc" }, { order: "asc" }] })),
  ["certificates"],
  { revalidate: PUBLIC_REVALIDATE, tags: ["certificates"] }
);