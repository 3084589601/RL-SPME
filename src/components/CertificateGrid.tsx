"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { Award, X, ZoomIn, ChevronLeft, ChevronRight, Search, Calendar } from "lucide-react";
import { GznuPanel } from "@/components/InnerPageLayout";
import { FastImg } from "@/components/FastImg";
import { useImagePreload } from "@/hooks/useImagePreload";
import { isDisplayableMedia, toThumbUrl } from "@/lib/media-url";
import { groupCertificatesIntoRows, sortCertificates } from "@/lib/certificate-layout";
import { EmptyState } from "@/components/EmptyState";

export interface Certificate {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  position: string;
  order: number;
  row: number;
}

function certificateAspect(variant: "left" | "grid") {
  return variant === "left" ? "aspect-[3/4]" : "aspect-[4/3]";
}

function isPlaceholder(url: string) {
  return !isDisplayableMedia(url);
}

function CertificateCard({
  cert,
  variant,
  onSelect,
}: {
  cert: Certificate;
  variant: "left" | "grid";
  onSelect: (cert: Certificate) => void;
}) {
  const placeholder = isPlaceholder(cert.imageUrl);
  const aspectClass = certificateAspect(variant);

  return (
    <button
      type="button"
      onClick={() => onSelect(cert)}
      className="gznu-panel gznu-card-hover bg-white border border-gray-100 overflow-hidden text-left w-full group"
    >
      <div
        className={`relative ${aspectClass} bg-gradient-to-br from-amber-50/80 via-blue-50 to-blue-100 overflow-hidden`}
      >
        {!placeholder ? (
          <FastImg
            src={cert.imageUrl}
            alt={cert.title}
            fill
            useThumb
            className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Award className="w-14 h-14 text-primary/25" />
          </div>
        )}
        {cert.year ? (
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-primary/90 text-white text-xs font-medium">
            {cert.year}
          </span>
        ) : null}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
      <div className="p-4 border-t border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-3 group-hover:text-primary transition-colors">
          {cert.title}
        </h3>
      </div>
    </button>
  );
}

function Lightbox({
  cert,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  cert: Certificate;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const placeholder = isPlaceholder(cert.imageUrl);
  const aspectClass = cert.position === "left" ? "aspect-[3/4] max-h-[72vh]" : "aspect-[4/3] max-h-[72vh]";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white max-w-4xl w-full max-h-[94vh] overflow-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b bg-[#f5f7fa] shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-400 mb-1">
              {index + 1} / {total}
            </p>
            <h3 className="font-bold text-lg text-gray-900 leading-snug">{cert.title}</h3>
            {cert.year ? (
              <p className="text-sm text-primary mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {cert.year} 年
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded shrink-0"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 flex items-center justify-center bg-gradient-to-br from-amber-50/50 via-blue-50 to-blue-100">
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/95 shadow hover:bg-white"
                aria-label="上一张"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/95 shadow hover:bg-white"
                aria-label="下一张"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : null}

          <div className={`relative w-full ${aspectClass} mx-auto`}>
            {!placeholder ? (
              <FastImg src={cert.imageUrl} alt={cert.title} fill priority className="object-contain p-3" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="w-24 h-24 text-primary/20" />
              </div>
            )}
          </div>
        </div>

        {cert.description ? (
          <div className="p-5 border-t border-gray-50 shrink-0">
            <p className="text-gray-600 leading-relaxed text-sm">{cert.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CertificateGrid({ certificates }: { certificates: Certificate[] }) {
  const [query, setQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const preloadUrls = useMemo(
    () => certificates.filter((c) => isDisplayableMedia(c.imageUrl)).map((c) => toThumbUrl(c.imageUrl)),
    [certificates]
  );
  useImagePreload(preloadUrls);

  const years = useMemo(
    () =>
      [...new Set(certificates.map((c) => c.year).filter((y): y is number => y != null))].sort(
        (a, b) => b - a
      ),
    [certificates]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortCertificates(
      certificates.filter((cert) => {
        if (yearFilter !== "all" && cert.year !== yearFilter) return false;
        if (!q) return true;
        return cert.title.toLowerCase().includes(q);
      })
    );
  }, [certificates, query, yearFilter]);

  const layoutRows = useMemo(() => groupCertificatesIntoRows(filtered), [filtered]);

  const selected = selectedIndex !== null ? filtered[selectedIndex] ?? null : null;

  const openAt = (cert: Certificate) => {
    const idx = filtered.findIndex((c) => c.id === cert.id);
    if (idx >= 0) setSelectedIndex(idx);
  };

  const close = useCallback(() => setSelectedIndex(null), []);

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i === null || filtered.length === 0 ? i : (i - 1 + filtered.length) % filtered.length));
  }, [filtered.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => (i === null || filtered.length === 0 ? i : (i + 1) % filtered.length));
  }, [filtered.length]);

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

  if (certificates.length === 0) {
    return (
      <GznuPanel className="p-12">
        <EmptyState title="暂无证书信息" icon={Award} description="管理员可在后台上传荣誉证书" />
      </GznuPanel>
    );
  }

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <GznuPanel className="p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
            <p className="text-xs text-gray-500">荣誉证书</p>
          </div>
        </GznuPanel>
        {years[0] ? (
          <GznuPanel className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.filter((c) => c.year === years[0]).length}
              </p>
              <p className="text-xs text-gray-500">{years[0]} 年</p>
            </div>
          </GznuPanel>
        ) : null}
        <GznuPanel className="p-4 flex items-center gap-3 hidden md:flex">
          <div className="w-10 h-10 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
            <span className="text-emerald-600 font-bold text-sm">{years.length}</span>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{years.length}</p>
            <p className="text-xs text-gray-500">覆盖年份</p>
          </div>
        </GznuPanel>
      </div>

      <GznuPanel className="p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索证书名称..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 focus:border-primary focus-visible:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          {years.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setYearFilter("all")}
                className={`px-3 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                  yearFilter === "all"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                全部
              </button>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYearFilter(y)}
                  className={`px-3 py-1.5 text-xs border transition-colors whitespace-nowrap ${
                    yearFilter === y
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Award className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>未找到匹配的证书</p>
            {(query || yearFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setYearFilter("all");
                }}
                className="mt-3 text-sm text-primary hover:underline"
              >
                清除筛选
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">共 {filtered.length} 项，点击证书可放大查看</p>
            <div className="space-y-5">
              {layoutRows.map((row) => (
                <div key={row.row} className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
                  {row.left ? (
                    <div className="lg:col-span-4">
                      <CertificateCard key={row.left.id} cert={row.left} variant="left" onSelect={openAt} />
                    </div>
                  ) : null}

                  {row.grid.length > 0 ? (
                    <div
                      className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 ${
                        row.left ? "lg:col-span-8" : "lg:col-span-12"
                      }`}
                    >
                      {row.grid.map((cert) => (
                        <CertificateCard key={cert.id} cert={cert} variant="grid" onSelect={openAt} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </GznuPanel>

      {selected && selectedIndex !== null ? (
        <Lightbox
          cert={selected}
          index={selectedIndex}
          total={filtered.length}
          onClose={close}
          onPrev={goPrev}
          onNext={goNext}
        />
      ) : null}
    </div>
  );
}
