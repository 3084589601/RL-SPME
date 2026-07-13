"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { useImagePreload } from "@/hooks/useImagePreload";
import { toThumbUrl } from "@/lib/media-url";

export type HighlightSlide = {
  id: string;
  title: string;
  imageUrl: string;
};

export function HighlightsCarousel({ items }: { items: HighlightSlide[] }) {
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const lastTimeRef = useRef(0);

  const count = items.length;
  const loopItems = useMemo(() => [...items, ...items], [items]);
  const speed = 30; // px/s

  useImagePreload(items.map((item) => toThumbUrl(item.imageUrl)));

  // JS 动画驱动滚动
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1); // 上限 100ms 防止跳帧
    lastTimeRef.current = timestamp;

    if (!paused && trackRef.current) {
      offsetRef.current += speed * dt;
      const halfWidth = trackRef.current.scrollWidth / 2;
      if (offsetRef.current >= halfWidth) {
        offsetRef.current -= halfWidth;
      }
      trackRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
    }

    animRef.current = requestAnimationFrame(animate);
  }, [paused, speed]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  // paused 变化时重置时间基准，避免跳帧
  useEffect(() => {
    lastTimeRef.current = 0;
  }, [paused]);

  if (count === 0) return null;

  return (
    <div
      className="gznu-panel bg-white border border-gray-100 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden py-5 md:py-6 bg-[#f5f7fa]">
        <div
          ref={trackRef}
          className="flex w-max gap-4 md:gap-6 px-4 will-change-transform"
          style={{ width: "max-content" }}
        >
          {loopItems.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="relative shrink-0 w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px] aspect-[16/10] overflow-hidden shadow-md ring-1 ring-black/5 bg-gray-200 bg-cover bg-center rounded-lg"
              style={{ backgroundImage: `url(${toThumbUrl(item.imageUrl)})` }}
              role="img"
              aria-label={item.title || "精彩瞬间"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
