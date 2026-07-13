"use client";

import { useMemo } from "react";
import { Calendar, Bot, Users, ExternalLink, Play, ImageIcon } from "lucide-react";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuSectionHead } from "@/components/GznuSectionHead";
import { FastImg } from "@/components/FastImg";
import { useImagePreload } from "@/hooks/useImagePreload";
import { type WorkDetailData, bilibiliEmbedUrl } from "@/lib/gallery-types";
import { isDisplayableMedia, toDisplayUrl, toThumbUrl } from "@/lib/media-url";

function hasMedia(url: string | null | undefined): url is string {
  return isDisplayableMedia(url);
}

function isPlaceholder(url: string) {
  return !isDisplayableMedia(url);
}

function MemberCard({ name, role, photoUrl }: { name: string; role?: string; photoUrl?: string }) {
  const showPhoto = hasMedia(photoUrl);

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 ring-2 ring-white shadow-md">
        {!showPhoto ? (
          <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-2xl">
            {name.slice(0, 1)}
          </div>
        ) : (
          <FastImg src={photoUrl} alt={name} fill className="object-cover" />
        )}
      </div>
      <p className="font-bold text-gray-900 text-sm mt-3">{name}</p>
      {role ? <p className="text-xs text-primary mt-0.5">{role}</p> : null}
    </div>
  );
}

function DemoVideo({ url }: { url: string | null }) {
  if (!hasMedia(url)) {
    return (
      <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">暂无演示视频</p>
      </div>
    );
  }

  if (url.startsWith("/uploads/videos/")) {
    return (
      <video src={url} controls className="w-full aspect-video bg-black" preload="auto">
        您的浏览器不支持视频播放
      </video>
    );
  }

  const embedUrl = bilibiliEmbedUrl(url);
  if (embedUrl) {
    return (
      <div className="relative aspect-video bg-black overflow-hidden">
        <iframe
          src={embedUrl}
          title="作品运行演示"
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          scrolling="no"
          frameBorder="0"
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
    >
      <Play className="w-4 h-4" />
      观看作品运行演示
      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
    </a>
  );
}

function MomentGrid({ images }: { images: (string | null)[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((url, index) => (
        <div
          key={index}
          className="relative aspect-[4/3] bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden ring-1 ring-black/5"
        >
          {hasMedia(url) ? (
            <FastImg
              src={url}
              alt={`赛场精彩瞬间 ${index + 1}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-1">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">待上传</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function WorkDetail({ work }: { work: WorkDetailData }) {
  const placeholder = isPlaceholder(work.imageUrl);

  const preloadUrls = useMemo(() => {
    const urls: string[] = [];
    if (hasMedia(work.imageUrl)) urls.push(toDisplayUrl(work.imageUrl));
    if (hasMedia(work.teamPhotoUrl)) urls.push(toDisplayUrl(work.teamPhotoUrl));
    work.members.forEach((m) => {
      if (hasMedia(m.photoUrl)) urls.push(toDisplayUrl(m.photoUrl));
    });
    work.highlights.momentImages.forEach((u) => {
      if (hasMedia(u)) urls.push(toDisplayUrl(u));
    });
    return urls;
  }, [work]);

  useImagePreload(preloadUrls);

  return (
    <div className="space-y-6">
      <GznuPanel className="overflow-hidden">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-blue-50 to-blue-100">
          {!placeholder ? (
            <FastImg src={work.imageUrl} alt={work.title} fill priority className="object-contain p-2" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <Bot className="w-20 h-20 text-primary/20 mb-4" />
              <p className="text-gray-500 text-sm">暂无作品图片</p>
            </div>
          )}
        </div>
        <div className="p-5 md:p-6 border-t border-gray-50">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{work.title}</h1>
          {work.year ? (
            <p className="text-sm text-primary mt-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {work.year} 年
            </p>
          ) : null}
          {work.description ? (
            <p className="text-gray-600 leading-relaxed mt-4">{work.description}</p>
          ) : null}
        </div>
      </GznuPanel>

      {work.teamName ? (
        <GznuPanel>
          <GznuSectionHead title="参赛队伍" />
          <div className="p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary shrink-0" />
              <h3 className="font-bold text-lg text-gray-900">{work.teamName}</h3>
            </div>
            {hasMedia(work.teamPhotoUrl) ? (
              <div className="relative aspect-[16/9] max-w-2xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
                <FastImg
                  src={work.teamPhotoUrl}
                  alt={`${work.teamName} 全队合照`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative aspect-[16/9] max-w-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <Users className="w-16 h-16 text-primary/20" />
              </div>
            )}
          </div>
        </GznuPanel>
      ) : null}

      {work.members.length > 0 ? (
        <GznuPanel>
          <GznuSectionHead title="队员风采" />
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {work.members.map((member) => (
                <MemberCard key={member.name} {...member} />
              ))}
            </div>
          </div>
        </GznuPanel>
      ) : null}

      <GznuPanel>
        <GznuSectionHead title="赛事精彩瞬间" />
        <div className="p-5 md:p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-l-4 border-primary pl-3">作品运行演示</h3>
            <DemoVideo url={work.highlights.demoVideo} />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-l-4 border-primary pl-3">赛场精彩瞬间</h3>
            <MomentGrid images={work.highlights.momentImages} />
          </div>
        </div>
      </GznuPanel>
    </div>
  );
}
