"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FastImg } from "@/components/FastImg";
import { useImagePreload } from "@/hooks/useImagePreload";
import { toThumbUrl } from "@/lib/media-url";

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  link?: string | null;
}

export function HomeHeroCarousel({
  slides,
  fullBleed = false,
}: {
  slides: CarouselSlide[];
  fullBleed?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const SWIPE_THRESHOLD = 50;

  const preloadUrls = useMemo(
    () => slides.flatMap((s) => [s.imageUrl, toThumbUrl(s.imageUrl)]),
    [slides]
  );
  useImagePreload(preloadUrls);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length, paused]);

  if (slides.length === 0) return null;

  return (
    <section
      className="w-full relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > SWIPE_THRESHOLD) {
          if (diff > 0) next();
          else prev();
        }
      }}
    >
      <div
        className={`relative w-full overflow-hidden bg-surface-dark ${
          fullBleed
            ? "h-[380px] sm:h-[440px] md:h-[500px] lg:h-[560px]"
            : "h-[320px] sm:h-[400px] md:h-[460px] lg:h-[520px] rounded-lg"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/35 to-transparent z-[15] pointer-events-none" />
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <FastImg
              src={s.imageUrl}
              alt={s.title || "轮播图片"}
              fill
              priority={i === 0}
              className="object-cover"
            />
            {(s.title || s.subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
            )}
            {(s.title || s.subtitle) && (
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20 pointer-events-none">
                <div className="max-w-7xl mx-auto">
                  {s.title && (
                    <h2 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg mb-2">
                      {s.title}
                    </h2>
                  )}
                  {s.subtitle && (
                    <p className="text-sm md:text-lg text-white/90 drop-shadow max-w-2xl">
                      {s.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )}
            {s.link && i === current && (
              <Link href={s.link} className="absolute inset-0 z-[15]" aria-label={s.title} />
            )}
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
              aria-label="上一张"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2 md:p-3 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition-colors"
              aria-label="下一张"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>

            <div className="absolute bottom-4 right-4 md:right-8 z-30 flex gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`relative w-12 h-8 md:w-16 md:h-10 rounded overflow-hidden border-2 transition-all ${
                    i === current ? "border-white scale-105 shadow-lg" : "border-white/40 opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`第 ${i + 1} 张`}
                >
                  <FastImg src={s.imageUrl} alt="" fill useThumb className="object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
