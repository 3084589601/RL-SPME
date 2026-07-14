"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toDisplayUrl, toThumbUrl } from "@/lib/media-url";

type FastImgProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  useThumb?: boolean;
};

function resolveSrc(src: string, useThumb: boolean) {
  const displaySrc = toDisplayUrl(src);
  return useThumb ? toThumbUrl(displaySrc) : displaySrc;
}

/** 直接加载静态 WebP，绕过 _next/image 优化延迟 */
export function FastImg({ src, alt, className, fill, priority, useThumb = false }: FastImgProps) {
  const displaySrc = toDisplayUrl(src);
  const [current, setCurrent] = useState(() => resolveSrc(src, useThumb));
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrent(resolveSrc(src, useThumb));
    setFailed(false);
    setLoaded(false);
  }, [src, useThumb]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-300",
          fill && "absolute inset-0 h-full w-full",
          className
        )}
        aria-label={`${alt || "图片"} — 加载失败`}
        role="img"
      >
        <ImageOff className="w-8 h-8 opacity-40" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={cn(
        fill && "absolute inset-0 h-full w-full",
        "bg-gray-100",
        !loaded && "animate-pulse",
        className
      )}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (current !== displaySrc) {
          // step 1: try display (non-thumb) URL
          setCurrent(displaySrc);
        } else if (current !== src) {
          // step 2: try original src
          setCurrent(src);
        } else {
          // all fallbacks exhausted — show broken placeholder
          setFailed(true);
        }
      }}
    />
  );
}
