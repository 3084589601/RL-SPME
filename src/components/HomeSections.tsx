"use client";

import Link from "next/link";
import { ChevronRight, Award, Calendar, ChevronLeft, X, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { GznuPanel } from "@/components/InnerPageLayout";
import { HighlightsCarousel } from "@/components/HighlightsCarousel";
import { FastImg } from "@/components/FastImg";
import { isDisplayableMedia } from "@/lib/media-url";
import { groupCertificatesIntoRows } from "@/lib/certificate-layout";
import { RESOURCE_TYPES, TECH_CATEGORIES } from "@/lib/utils";

export type HomeCertificate = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  position: string;
  order: number;
  row: number;
};

export type HomeResource = {
  id: string;
  title: string;
  description: string | null;
  type: keyof typeof RESOURCE_TYPES;
  category: keyof typeof TECH_CATEGORIES;
  createdAt: string | Date;
};

function formatDate(d: string | Date) {
  const date = new Date(d);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function HomeLatestResources({ items }: { items: HomeResource[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-14 bg-[#f5f7fa]">
      <div className="max-w-[1200px] mx-auto px-4">
        <SectionHeader title="最新资源" subtitle="Latest Resources" href="/resources" />
        <GznuPanel>
          <ul>
            {items.map((item) => {
              const typeLabel = RESOURCE_TYPES[item.type]?.label || "资源";
              const catLabel = TECH_CATEGORIES[item.category]?.label || "";
              return (
                <li key={item.id} className="border-b border-gray-50 last:border-0">
                  <Link href={`/resources/${item.id}`} className="gznu-list-item group">
                    <span className="gznu-date-badge hidden sm:block">{formatDate(item.createdAt)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="gznu-list-item-title text-sm font-medium text-gray-900 group-hover:text-primary line-clamp-1 transition-colors">
                        {item.title}
                      </p>
                      {item.description ? (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.description}</p>
                      ) : null}
                      <p className="text-xs text-gray-400 mt-1.5">
                        {catLabel && <span>{catLabel} · </span>}
                        {typeLabel}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </GznuPanel>
      </div>
    </section>
  );
}

type ImageItem = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  year?: number | null;
  orientation?: "portrait" | "landscape";
  position?: string;
};

export function HomeHighlights({ items }: { items: ImageItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="py-14 bg-[#f5f7fa]">
      <div className="max-w-[1200px] mx-auto px-4">
        <SectionHeader title="精彩瞬间" subtitle="Highlights" />
        <HighlightsCarousel
          items={items.map((item) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
          }))}
        />
      </div>
    </section>
  );
}

function certIsPlaceholder(url: string) {
  return !isDisplayableMedia(url);
}

function HomeCertThumb({
  cert,
  variant,
  onSelect,
}: {
  cert: HomeCertificate;
  variant: "left" | "grid";
  onSelect: (cert: HomeCertificate) => void;
}) {
  const placeholder = certIsPlaceholder(cert.imageUrl);
  const aspectClass = variant === "left" ? "aspect-[3/4]" : "aspect-[4/3]";

  return (
    <button
      type="button"
      onClick={() => onSelect(cert)}
      className="group relative w-full overflow-hidden border border-gray-100 bg-white text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div
        className={`relative ${aspectClass} overflow-hidden bg-gradient-to-br from-amber-50/80 via-blue-50 to-blue-100`}
      >
        {!placeholder ? (
          <FastImg
            src={cert.imageUrl}
            alt={cert.title}
            fill
            useThumb
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Award className="w-10 h-10 text-primary/25" />
          </div>
        )}
        {cert.year ? (
          <span className="absolute left-2 top-2 bg-primary/90 px-2 py-0.5 text-xs font-medium text-white">
            {cert.year}
          </span>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
          <ZoomIn className="h-6 w-6 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div className="border-t border-gray-50 p-3">
        <p className="line-clamp-2 text-xs font-medium text-gray-800 transition-colors group-hover:text-primary md:text-sm">
          {cert.title}
        </p>
      </div>
    </button>
  );
}

function HomeCertLightbox({
  cert,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  cert: HomeCertificate;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const placeholder = certIsPlaceholder(cert.imageUrl);
  const aspectClass =
    cert.position === "left" ? "aspect-[3/4] max-h-[72vh]" : "aspect-[4/3] max-h-[72vh]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b bg-[#f5f7fa] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs text-gray-400">
              {index + 1} / {total}
            </p>
            <h3 className="text-lg font-bold leading-snug text-gray-900">{cert.title}</h3>
            {cert.year ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-primary">
                <Calendar className="h-3.5 w-3.5" />
                {cert.year} 年
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1.5 hover:bg-gray-200"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-gradient-to-br from-amber-50/50 via-blue-50 to-blue-100">
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-white/95 p-2 shadow hover:bg-white md:left-4"
                aria-label="上一张"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-white/95 p-2 shadow hover:bg-white md:right-4"
                aria-label="下一张"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          <div className={`relative mx-auto w-full ${aspectClass}`}>
            {!placeholder ? (
              <FastImg src={cert.imageUrl} alt={cert.title} fill priority className="object-contain p-3" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="h-24 w-24 text-primary/20" />
              </div>
            )}
          </div>
        </div>

        {cert.description ? (
          <div className="shrink-0 border-t border-gray-50 p-5">
            <p className="text-sm leading-relaxed text-gray-600">{cert.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HomeCertificates({ certificates }: { certificates: HomeCertificate[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const layoutRows = useMemo(() => groupCertificatesIntoRows(certificates), [certificates]);
  const displayed = useMemo(
    () => layoutRows.flatMap((row) => [row.left, ...row.grid].filter((cert): cert is HomeCertificate => !!cert)),
    [layoutRows]
  );

  const selected = selectedIndex !== null ? displayed[selectedIndex] ?? null : null;

  const openAt = (cert: HomeCertificate) => {
    const idx = displayed.findIndex((c) => c.id === cert.id);
    if (idx >= 0) setSelectedIndex(idx);
  };

  const close = useCallback(() => setSelectedIndex(null), []);

  const goPrev = useCallback(() => {
    setSelectedIndex((i) =>
      i === null || displayed.length === 0 ? i : (i - 1 + displayed.length) % displayed.length
    );
  }, [displayed.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((i) =>
      i === null || displayed.length === 0 ? i : (i + 1) % displayed.length
    );
  }, [displayed.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, close, goPrev, goNext]);

  if (displayed.length === 0) return null;

  return (
    <section className="bg-[#f5f7fa] py-14">
      <div className="mx-auto max-w-[1200px] px-4">
        <SectionHeader title="荣誉证书" subtitle="Honors & Awards" href="/certificates" />

        <div className="space-y-5">
          {layoutRows.map((row) => (
            <div key={row.row} className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
              {row.left ? (
                <div className="lg:col-span-4">
                  <HomeCertThumb key={row.left.id} cert={row.left} variant="left" onSelect={openAt} />
                </div>
              ) : null}

              {row.grid.length > 0 ? (
                <div
                  className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${
                    row.left ? "lg:col-span-8" : "lg:col-span-12"
                  }`}
                >
                  {row.grid.map((cert) => (
                    <HomeCertThumb key={cert.id} cert={cert} variant="grid" onSelect={openAt} />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {certificates.length > displayed.length ? (
          <div className="mt-6 text-center">
            <Link
              href="/certificates"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              查看全部荣誉证书
            </Link>
          </div>
        ) : null}
      </div>

      {selected && selectedIndex !== null ? (
        <HomeCertLightbox
          cert={selected}
          index={selectedIndex}
          total={displayed.length}
          onClose={close}
          onPrev={goPrev}
          onNext={goNext}
        />
      ) : null}
    </section>
  );
}
