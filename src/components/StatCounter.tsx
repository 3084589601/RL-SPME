"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function StatCounter({
  value,
  suffix = "",
  label,
  duration = 1500,
  light = false,
}: {
  value: number;
  suffix?: string;
  label: string;
  duration?: number;
  light?: boolean;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(value);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className="text-center group">
      <div className="relative inline-block">
        <span className={cn("text-4xl md:text-5xl font-bold tabular-nums", light ? "text-white" : "text-primary")}>
          {count}
        </span>
        {suffix && (
          <span className={cn("text-xl md:text-2xl font-bold", light ? "text-white/80" : "text-primary/70")}>{suffix}</span>
        )}
      </div>
      <p className={cn("text-sm mt-2 transition-colors", light ? "text-blue-100 group-hover:text-white" : "text-gray-500 group-hover:text-gray-700")}>{label}</p>
    </div>
  );
}
