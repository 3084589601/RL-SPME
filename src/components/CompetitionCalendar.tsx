"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Trophy } from "lucide-react";
import { COMPETITIONS, type Competition } from "@/lib/competition-data";
import { SectionHeader } from "@/components/SectionHeader";
import { cn } from "@/lib/utils";

// ---- helpers ----

function calcRemaining(targetISO: string) {
  const diff = new Date(targetISO).getTime() - Date.now();
  if (diff <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true } as const;
  }
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return { total, days, hours, minutes, seconds, expired: false } as const;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  if (d.getHours() === 0 && d.getMinutes() === 0) {
    return `${d.getFullYear()}.${month}.${day}`;
  }
  return `${d.getFullYear()}.${month}.${day} ${hour}:${minute}`;
}

// ---- sub-components ----

function CountdownDigits({
  time,
  accent,
  mounted,
}: {
  time: ReturnType<typeof calcRemaining>;
  accent: string;
  mounted: boolean;
}) {
  // SSR 时显示占位，客户端挂载后显示精确倒计时
  if (!mounted) {
    return <span className="text-xs text-gray-300">加载中...</span>;
  }

  if (time.expired) return null;

  if (time.days === 0) {
    return (
      <span className="tabular-nums font-bold tracking-tight" style={{ color: accent, fontSize: 13 }}>
        {String(time.hours).padStart(2, "0")}:{String(time.minutes).padStart(2, "0")}:{String(time.seconds).padStart(2, "0")}
      </span>
    );
  }

  if (time.days <= 30) {
    return (
      <span className="tabular-nums font-bold" style={{ color: accent, fontSize: 13 }}>
        {time.days}<span className="text-[10px] font-normal ml-0.5">天</span>
        {" "}
        {String(time.hours).padStart(2, "0")}<span className="text-[10px] font-normal ml-0.5">时</span>
      </span>
    );
  }

  return (
    <span className="tabular-nums font-bold" style={{ color: accent, fontSize: 15 }}>
      {time.days}<span className="text-xs font-normal ml-0.5">天</span>
    </span>
  );
}

function CompetitionCard({ comp }: { comp: Competition }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const times = comp.milestones.map((m) => ({
    ...m,
    time: calcRemaining(m.date),
  }));

  const allExpired = times.every((t) => t.time.expired);
  const nextActive = times.find((t) => !t.time.expired);

  const accentMap: Record<string, string> = {
    blue: "#2563eb", red: "#dc2626", purple: "#9333ea",
    emerald: "#059669", amber: "#d97706", cyan: "#0891b2",
  };
  const accent = accentMap[comp.color.replace("bg-", "")] || "#2563eb";

  // 进度条：仅在客户端挂载后计算，避免 SSR 与客户端不一致
  const progressPct = mounted ? (() => {
    const first = new Date(times[0].date).getTime();
    const last = new Date(times[times.length - 1].date).getTime();
    const span = last - first;
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((now - first) / span) * 100));
  })() : 0;

  return (
    <a
      href={comp.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block bg-white border border-gray-100 rounded-lg p-4 transition-all",
        "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        allExpired && "opacity-60"
      )}
    >
      {/* 头部 */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0", comp.color)}>
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 leading-tight">
            {comp.name}
          </h3>
          {nextActive && (
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: accent }}>
              {nextActive.label} · 倒计时 {nextActive.time.days > 0 ? `${nextActive.time.days} 天` : `${nextActive.time.hours} 小时`}
            </p>
          )}
          {allExpired && <p className="text-[10px] text-gray-400 mt-0.5">本届已全部结束</p>}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
      </div>

      {/* 倒计时组 */}
      <div
        className="grid gap-2 mb-2"
        style={{ gridTemplateColumns: `repeat(${times.length}, 1fr)` }}
      >
        {times.map((t) => (
          <div key={t.label} className="flex flex-col items-center text-center">
            <span className="text-[10px] text-gray-400 mb-0.5">{t.label}</span>
            {t.time.expired ? (
              <span className="text-[10px] text-gray-300 line-through">{fmtDate(t.date)}</span>
            ) : (
              <>
                <CountdownDigits time={t.time} accent={accent} mounted={mounted} />
                <span className="text-[9px] text-gray-400 mt-0.5">{fmtDate(t.date)}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 进度条 — 仅在客户端渲染 */}
      {mounted && (
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, backgroundColor: allExpired ? "#d1d5db" : accent }}
          />
        </div>
      )}
    </a>
  );
}

// ---- exported ----

/** 仅卡片网格 + 提示（供内联使用） */
export function CompetitionCards({ cols = 3 }: { cols?: 1 | 2 | 3 }) {
  const gridClass =
    cols === 1
      ? "grid grid-cols-1 gap-3"
      : cols === 2
        ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";

  return (
    <div>
      <div className={gridClass}>
        {COMPETITIONS.map((comp) => (
          <CompetitionCard key={comp.id} comp={comp} />
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-4">
        时间来源各赛事官网及高校通知，实际日期以官方最新公告为准。点击卡片直达官网。
      </p>
    </div>
  );
}

export function CompetitionCalendar() {
  return (
    <section className="py-14 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <SectionHeader title="竞赛日历" subtitle="Competition Calendar" />
        <CompetitionCards />
      </div>
    </section>
  );
}
