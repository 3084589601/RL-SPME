"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Users, X, ZoomIn, Trophy, Calendar } from "lucide-react";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuTabs } from "@/components/GznuTabs";
import { FastImg } from "@/components/FastImg";
import { useImagePreload } from "@/hooks/useImagePreload";
import { isDisplayableMedia, toThumbUrl } from "@/lib/media-url";
import { EmptyState } from "@/components/EmptyState";

export interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  type: string;
  year: number | null;
}

function isPlaceholder(url: string) {
  return !isDisplayableMedia(url);
}

function GalleryCard({
  item,
  onSelect,
}: {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
}) {
  const placeholder = isPlaceholder(item.imageUrl);
  const isWork = item.type === "work";

  const imageBlock = (
    <div className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      {!placeholder ? (
        <FastImg
          src={item.imageUrl}
          alt={item.title}
          fill
          useThumb
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {isWork ? (
            <Bot className="w-14 h-14 text-primary/20" />
          ) : (
            <Users className="w-14 h-14 text-primary/20" />
          )}
        </div>
      )}
      {item.year ? (
        <span className="absolute top-3 left-3 px-2 py-0.5 bg-primary/90 text-white text-xs font-medium">
          {item.year}
        </span>
      ) : null}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
    </div>
  );

  if (isWork) {
    return (
      <Link
        href={`/gallery/works/${item.id}`}
        className="gznu-panel gznu-card-hover bg-white border border-gray-100 overflow-hidden text-left w-full group block"
      >
        {imageBlock}
        <div className="p-4 border-t border-gray-50">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.description ? (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.description}</p>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="gznu-panel gznu-card-hover bg-white border border-gray-100 overflow-hidden text-left w-full group"
    >
      {imageBlock}
      <div className="p-4 border-t border-gray-50">
        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        {item.description ? (
          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.description}</p>
        ) : null}
      </div>
    </button>
  );
}

function Lightbox({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const placeholder = isPlaceholder(item.imageUrl);
  const Icon = item.type === "work" ? Bot : Users;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white max-w-3xl w-full max-h-[92vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b bg-[#f5f7fa]">
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
            {item.year ? (
              <p className="text-sm text-primary mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {item.year} 年
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
        <div className="relative aspect-[16/10] bg-gradient-to-br from-blue-50 to-blue-100">
          {!placeholder ? (
            <FastImg src={item.imageUrl} alt={item.title} fill className="object-contain p-2" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Icon className="w-20 h-20 text-primary/20 mb-4" />
              <p className="text-gray-500 text-sm">暂无图片，可在后台上传</p>
            </div>
          )}
        </div>
        {item.description ? (
          <div className="p-6 border-t border-gray-50">
            <p className="text-gray-600 leading-relaxed">{item.description}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function GalleryView({
  members,
  works,
}: {
  members: GalleryItem[];
  works: GalleryItem[];
}) {
  const [tab, setTab] = useState<"works" | "members">(works.length > 0 ? "works" : "members");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const activePool = tab === "works" ? works : members;

  const years = useMemo(
    () =>
      [...new Set(activePool.map((i) => i.year).filter((y): y is number => y != null))].sort(
        (a, b) => b - a
      ),
    [activePool]
  );

  const filtered = useMemo(
    () => (yearFilter === "all" ? activePool : activePool.filter((i) => i.year === yearFilter)),
    [activePool, yearFilter]
  );

  useImagePreload(
    useMemo(
      () => filtered.filter((i) => isDisplayableMedia(i.imageUrl)).map((i) => toThumbUrl(i.imageUrl)),
      [filtered]
    )
  );

  const tabs = [
    { key: "works", label: `竞赛作品 (${works.length})` },
    { key: "members", label: `成员风采 (${members.length})` },
  ];

  const handleTabChange = (key: string) => {
    setTab(key as "works" | "members");
    setYearFilter("all");
  };

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <GznuPanel className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{works.length}</p>
            <p className="text-xs text-gray-500">竞赛作品</p>
          </div>
        </GznuPanel>
        <GznuPanel className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            <p className="text-xs text-gray-500">成员风采</p>
          </div>
        </GznuPanel>
      </div>

      <GznuTabs items={tabs} active={tab} onChange={handleTabChange} />

      <GznuPanel className="border-t-0 p-4 md:p-5">
        {years.length > 1 ? (
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              type="button"
              onClick={() => setYearFilter("all")}
              className={`px-3 py-1 text-xs border transition-colors ${
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
                className={`px-3 py-1 text-xs border transition-colors ${
                  yearFilter === y
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                }`}
              >
                {y} 年
              </button>
            ))}
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            icon={tab === "works" ? Bot : Users}
            title={`暂无${tab === "works" ? "竞赛作品" : "成员风采"}`}
            description="成员可在后台上传作品与照片"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <GalleryCard key={item.id} item={item} onSelect={setSelected} />
            ))}
          </div>
        )}
      </GznuPanel>

      {tab === "works" && works.length > 0 ? (
        <p className="text-xs text-gray-400 text-center mt-4">
          成员可前往
          <Link href="/resources?type=COMPETITION" className="text-primary hover:underline mx-1">
            学习资源库
          </Link>
          查看比赛作品详情与下载
        </p>
      ) : null}

      {selected ? <Lightbox item={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
