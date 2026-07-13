"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { DanmakuItem, DanmakuMode, DanmakuSettings } from "@/lib/danmaku-types";

interface ActiveDanmaku {
  key: string;
  item: DanmakuItem;
  lane: number;
  duration: number;
}

interface DanmakuOverlayProps {
  items: DanmakuItem[];
  currentTime: number;
  playing: boolean;
  playbackRate: number;
  settings: DanmakuSettings;
  seekToken: number;
}

const LANE_COUNT = 14;

function scrollDuration(content: string, speed: number, playbackRate: number): number {
  const base = 8 + content.length * 0.12;
  return Math.max(4, base / Math.max(0.5, speed) / Math.max(0.25, playbackRate));
}

export function DanmakuOverlay({
  items,
  currentTime,
  playing,
  playbackRate,
  settings,
  seekToken,
}: DanmakuOverlayProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveDanmaku[]>([]);
  const [travelPx, setTravelPx] = useState(640);
  const firedRef = useRef<Set<string>>(new Set());
  const laneFreeAtRef = useRef<number[]>(Array(LANE_COUNT).fill(0));
  const lastTimeRef = useRef(0);
  const itemsRef = useRef(items);
  const currentTimeRef = useRef(currentTime);
  itemsRef.current = items;
  currentTimeRef.current = currentTime;

  useEffect(() => {
    firedRef.current.clear();
    laneFreeAtRef.current = Array(LANE_COUNT).fill(0);
    lastTimeRef.current = currentTimeRef.current;
    setActive([]);
    for (const item of itemsRef.current) {
      if (item.time < currentTimeRef.current - 0.05) {
        firedRef.current.add(item.id);
      }
    }
  }, [seekToken]);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    const update = () => setTravelPx(Math.max(el.clientWidth, 320));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const spawnItems = useCallback(
    (toFire: DanmakuItem[]) => {
      if (toFire.length === 0) return;
      const now = currentTime;
      const nextActive: ActiveDanmaku[] = [];

      for (const item of toFire) {
        firedRef.current.add(item.id);
        const mode = (item.mode || "scroll") as DanmakuMode;

        if (mode === "scroll") {
          let lane = 0;
          let earliest = laneFreeAtRef.current[0];
          for (let i = 1; i < LANE_COUNT; i++) {
            if (laneFreeAtRef.current[i] < earliest) {
              earliest = laneFreeAtRef.current[i];
              lane = i;
            }
          }
          const duration = scrollDuration(item.content, settings.speed, playbackRate);
          laneFreeAtRef.current[lane] = now + duration * 0.55;
          nextActive.push({ key: `${item.id}-${now}-${Math.random()}`, item, lane, duration });
        } else {
          nextActive.push({
            key: `${item.id}-${now}-${Math.random()}`,
            item,
            lane: 0,
            duration: 4,
          });
        }
      }

      setActive((prev) => [...prev, ...nextActive]);
    },
    [currentTime, playbackRate, settings.speed],
  );

  useEffect(() => {
    if (!settings.enabled) return;

    const prev = lastTimeRef.current;
    const now = currentTime;

    const toFire = items.filter(
      (item) =>
        !firedRef.current.has(item.id) &&
        item.time <= now + 0.05 &&
        item.time > prev - 0.05,
    );

    lastTimeRef.current = now;

    if (toFire.length > 0) {
      spawnItems(toFire);
    }
  }, [currentTime, items, settings.enabled, spawnItems]);

  useEffect(() => {
    if (active.length === 0) return;
    const timers = active.map((entry) =>
      setTimeout(() => {
        setActive((prev) => prev.filter((a) => a.key !== entry.key));
      }, entry.duration * 1000 + 200),
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!settings.enabled) return null;

  const areaHeight = `${Math.round(settings.area * 100)}%`;

  return (
    <div
      ref={layerRef}
      className={`danmaku-layer pointer-events-none absolute inset-0 z-[30] overflow-hidden${playing ? "" : " is-paused"}`}
      style={{ ["--dm-travel" as string]: `${travelPx}px` }}
      aria-hidden
    >
      <div className="danmaku-area" style={{ height: areaHeight }}>
        {active.map((entry) => {
          const mode = (entry.item.mode || "scroll") as DanmakuMode;
          const style: React.CSSProperties = {
            color: entry.item.color,
            fontSize: `${settings.fontSize}px`,
            opacity: settings.opacity,
          };

          if (mode === "scroll") {
            const laneHeight = 100 / LANE_COUNT;
            return (
              <span
                key={entry.key}
                className="danmaku-item danmaku-scroll"
                style={{
                  ...style,
                  top: `${entry.lane * laneHeight}%`,
                  animationDuration: `${entry.duration}s`,
                }}
              >
                {entry.item.content}
              </span>
            );
          }

          return (
            <span
              key={entry.key}
              className={`danmaku-item danmaku-fixed danmaku-${mode}`}
              style={{
                ...style,
                animationDuration: `${entry.duration}s`,
              }}
            >
              {entry.item.content}
            </span>
          );
        })}
      </div>
    </div>
  );
}