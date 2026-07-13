"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Download,
  Check, X, Eye, FileCode, Heart, Star, User, Play, Pause, Video, MessageSquare, Gauge,
  Volume2, VolumeX, Maximize, Minimize, Captions, Settings2, Trash2, CheckCircle2,
} from "lucide-react";
import { getCategoryMeta, RESOURCE_TYPES, formatFileSize, cn, getResourceTypeLabel, type ResourceTypeKey } from "@/lib/utils";
import { stableEpisodeId, type EpisodeProgressMap } from "@/lib/episode-progress";
import { resolveVideoEmbed } from "@/lib/gallery-types";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuSectionHead } from "@/components/GznuSectionHead";
import { LearningExperiencePanel } from "@/components/LearningExperiencePanel";
import { DanmakuOverlay } from "@/components/video/DanmakuOverlay";
import {
  DANMAKU_COLORS,
  DEFAULT_DANMAKU_SETTINGS,
  loadDanmakuSettings,
  saveDanmakuSettings,
  type DanmakuItem,
  type DanmakuMode,
  type DanmakuSettings,
} from "@/lib/danmaku-types";
interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; name: string };
}

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  status: string;
  videoUrl: string | null;
  competition: string | null;
  year: number | null;
  fileName: string | null;
  fileSize: number | null;
  filePath: string | null;
  isPlaylist: boolean;
  playlistItems: string | null;
  author: { name: string; id: string };
  comments: Comment[];
  createdAt: string | Date;
}

interface Interaction {
  liked: boolean;
  favorited: boolean;
  progress: number;
  completed: boolean;
}

interface VideoPlaylistItem {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
}

interface LearningStats {
  totalVideos: number;
  completedVideos: number;
  totalDuration: number;
  studyDays: number;
  currentStreak: number;
  todayCompletedVideos?: number;
  courseComplete?: boolean;
}

function VideoSection({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: typeof Play;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
        {Icon ? <Icon className="h-4 w-4 text-primary shrink-0" /> : null}
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2, 3] as const;
const RATE_MENU_OPTIONS = [...PLAYBACK_RATES].reverse();

function formatRateLabel(rate: number): string {
  if (rate === 1) return "1.0x";
  if (Number.isInteger(rate)) return `${rate.toFixed(1)}x`;
  return `${rate}x`;
}

const QUALITY_OPTIONS = [
  { id: "auto", label: "自动", height: null as number | null },
  { id: "480", label: "480P", height: 480 },
  { id: "720", label: "720P", height: 720 },
  { id: "1080", label: "1080P", height: 1080 },
  { id: "1440", label: "2K", height: 1440 },
  { id: "2160", label: "4K", height: 2160 },
] as const;

type SubtitleTrack = { src: string; label: string; lang: string };

async function urlExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

function variantVideoSrc(src: string, height: number): string {
  const dot = src.lastIndexOf(".");
  if (dot === -1) return src;
  return `${src.slice(0, dot)}_${height}p${src.slice(dot)}`;
}

function subtitleCandidates(src: string): SubtitleTrack[] {
  const dot = src.lastIndexOf(".");
  const base = dot === -1 ? src : src.slice(0, dot);
  return [
    { src: `${base}.vtt`, label: "中文", lang: "zh" },
    { src: `${base}.zh.vtt`, label: "中文", lang: "zh" },
    { src: `${base}_cn.vtt`, label: "中文", lang: "zh" },
    { src: `${base}.en.vtt`, label: "English", lang: "en" },
  ];
}

function PlayerControlPopup({
  open,
  className = "",
  children,
}: {
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`player-control-popup${open ? " is-open" : ""}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`player-popup-panel rounded-sm ${className}`}>{children}</div>
    </div>
  );
}

function PlayerPopupItem({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`block w-full px-4 py-1.5 text-center text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "font-medium text-[#00a1d6]"
          : disabled
            ? "text-gray-500"
            : "text-white hover:text-[#00a1d6]"
      }`}
    >
      {children}
    </button>
  );
}

function VerticalVolumePanel({
  open,
  volume,
  muted,
  onChange,
}: {
  open?: boolean;
  volume: number;
  muted: boolean;
  onChange: (value: number) => void;
}) {
  const pct = Math.round((muted ? 0 : volume) * 100);

  return (
    <PlayerControlPopup open={open} className="flex flex-col items-center px-4 py-3">
      <span className="mb-3 text-sm font-medium tabular-nums text-white">{pct}</span>
      <div className="player-volume-bar" style={{ ["--vol-pct" as string]: `${pct}%` }}>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
          className="player-vertical-slider"
          aria-label="音量"
        />
      </div>
    </PlayerControlPopup>
  );
}

function VerticalSubtitlePanel({
  open,
  activeSubtitle,
  tracks,
  onSelect,
}: {
  open?: boolean;
  activeSubtitle: number | null;
  tracks: SubtitleTrack[];
  onSelect: (index: number | null) => void;
}) {
  return (
    <PlayerControlPopup open={open} className="min-w-[5.5rem] py-2">
      <PlayerPopupItem active={activeSubtitle === null} onClick={() => onSelect(null)}>
        关闭
      </PlayerPopupItem>
      {tracks.length === 0 ? (
        <p className="px-4 py-1.5 text-center text-xs text-gray-400">暂无字幕</p>
      ) : (
        tracks.map((track, i) => (
          <PlayerPopupItem key={track.src} active={activeSubtitle === i} onClick={() => onSelect(i)}>
            {track.label}
          </PlayerPopupItem>
        ))
      )}
    </PlayerControlPopup>
  );
}

function VerticalRatePanel({
  open,
  rate,
  onSelect,
}: {
  open?: boolean;
  rate: number;
  onSelect: (rate: number) => void;
}) {
  return (
    <PlayerControlPopup open={open} className="min-w-[5.5rem] py-2">
      {RATE_MENU_OPTIONS.map((option) => (
        <PlayerPopupItem key={option} active={rate === option} onClick={() => onSelect(option)}>
          {formatRateLabel(option)}
        </PlayerPopupItem>
      ))}
    </PlayerControlPopup>
  );
}

function VerticalQualityPanel({
  open,
  qualityId,
  nativeHeight,
  onSelect,
}: {
  open?: boolean;
  qualityId: string;
  nativeHeight: number;
  onSelect: (id: string, height: number | null) => void;
}) {
  return (
    <PlayerControlPopup open={open} className="min-w-[7.5rem] py-2">
      {QUALITY_OPTIONS.map((q) => {
        const disabled = q.height !== null && nativeHeight > 0 && q.height > nativeHeight;
        return (
          <PlayerPopupItem
            key={q.id}
            active={qualityId === q.id}
            disabled={disabled}
            onClick={() => void onSelect(q.id, q.height)}
          >
            {q.label}
            {disabled ? " (不可用)" : ""}
          </PlayerPopupItem>
        );
      })}
    </PlayerControlPopup>
  );
}

function DanmakuSettingsPanel({
  open,
  settings,
  onChange,
  mode,
  onModeChange,
  color,
  onColorChange,
}: {
  open?: boolean;
  settings: DanmakuSettings;
  onChange: (patch: Partial<DanmakuSettings>) => void;
  mode?: DanmakuMode;
  onModeChange?: (mode: DanmakuMode) => void;
  color?: string;
  onColorChange?: (color: string) => void;
}) {
  return (
    <PlayerControlPopup open={open} className="min-w-[10rem] py-2 px-1">
      <div className="player-danmaku-settings-row px-3">
        <label htmlFor="dm-opacity">不透明度</label>
        <input
          id="dm-opacity"
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={settings.opacity}
          onChange={(e) => onChange({ opacity: parseFloat(e.target.value) })}
        />
      </div>
      <div className="player-danmaku-settings-row px-3">
        <label htmlFor="dm-font">字号</label>
        <input
          id="dm-font"
          type="range"
          min={18}
          max={36}
          step={1}
          value={settings.fontSize}
          onChange={(e) => onChange({ fontSize: parseInt(e.target.value, 10) })}
        />
      </div>
      <div className="player-danmaku-settings-row px-3">
        <label htmlFor="dm-area">显示区域</label>
        <input
          id="dm-area"
          type="range"
          min={0.25}
          max={1}
          step={0.05}
          value={settings.area}
          onChange={(e) => onChange({ area: parseFloat(e.target.value) })}
        />
      </div>
      <div className="player-danmaku-settings-row px-3 pb-1">
        <label htmlFor="dm-speed">速度</label>
        <input
          id="dm-speed"
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={settings.speed}
          onChange={(e) => onChange({ speed: parseFloat(e.target.value) })}
        />
      </div>
      {mode !== undefined && onModeChange ? (
        <div className="flex flex-wrap justify-center gap-1 border-t border-white/10 px-3 py-2">
          {(["scroll", "top", "bottom"] as DanmakuMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`rounded px-2 py-1 text-xs ${mode === m ? "bg-[#00a1d6] text-white" : "text-white/80 hover:text-white"}`}
            >
              {m === "scroll" ? "滚动" : m === "top" ? "顶部" : "底部"}
            </button>
          ))}
        </div>
      ) : null}
      {color !== undefined && onColorChange ? (
        <div className="flex flex-wrap justify-center gap-1 px-3 pb-2 pt-1">
          {DANMAKU_COLORS.slice(0, 8).map((c) => (
            <button
              key={c}
              type="button"
              className={`player-danmaku-color${color === c ? " is-active" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
              aria-label={`弹幕颜色 ${c}`}
            />
          ))}
        </div>
      ) : null}
    </PlayerControlPopup>
  );
}

function NativeVideoPlayer({
  src,
  title,
  playerKey,
  resourceId,
  onEnded,
  onPlaybackUpdate,
  danmakuRefreshKey = 0,
  onDanmakuSent,
}: {
  src: string;
  title: string;
  playerKey: string;
  resourceId: string;
  onEnded?: () => void;
  onPlaybackUpdate?: (payload: {
    percent: number;
    currentTime: number;
    duration: number;
    trackable: boolean;
  }) => void;
  danmakuRefreshKey?: number;
  onDanmakuSent?: (item: DanmakuItem) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedRef = useRef(-1);
  const [activeSrc, setActiveSrc] = useState(src);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [openMenu, setOpenMenu] = useState<null | "rate" | "quality" | "subtitle" | "volume" | "danmaku">(null);
  const [qualityId, setQualityId] = useState<string>("auto");
  const [nativeHeight, setNativeHeight] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState<number | null>(null);
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [danmakuSettings, setDanmakuSettings] = useState<DanmakuSettings>(DEFAULT_DANMAKU_SETTINGS);
  const [danmakuText, setDanmakuText] = useState("");
  const [danmakuColor, setDanmakuColor] = useState<string>(DANMAKU_COLORS[0]);
  const [danmakuMode, setDanmakuMode] = useState<DanmakuMode>("scroll");
  const [danmakuSending, setDanmakuSending] = useState(false);
  const [seekToken, setSeekToken] = useState(0);

  useEffect(() => {
    lastReportedRef.current = -1;
    setActiveSrc(src);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackRate(1);
    setVolume(1);
    setMuted(false);
    setSeeking(false);
    setSeekValue(0);
    setOpenMenu(null);
    setQualityId("auto");
    setNativeHeight(0);
    setActiveSubtitle(null);
    setDanmakuText("");
    setSeekToken((t) => t + 1);
  }, [playerKey, src]);

  useEffect(() => {
    setDanmakuSettings(loadDanmakuSettings());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/resources/${resourceId}/danmaku?from=0&to=999999`);
        if (!res.ok) return;
        const data = (await res.json()) as DanmakuItem[];
        if (!cancelled) setDanmakus(data);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [resourceId, playerKey, danmakuRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found: SubtitleTrack[] = [];
      const seen = new Set<string>();
      for (const track of subtitleCandidates(src)) {
        if (seen.has(track.src)) continue;
        seen.add(track.src);
        if (await urlExists(track.src)) found.push(track);
      }
      if (!cancelled) setSubtitleTracks(found);
    })();
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!fullscreen) {
      setOpenMenu((m) => (m === "danmaku" ? null : m));
    }
  }, [fullscreen]);

  const reportPlayback = useCallback((video: HTMLVideoElement, force = false) => {
    const dur = video.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;
    const time = video.currentTime;
    const percent = Math.min(100, Math.round((time / dur) * 100));
    if (!force && percent === lastReportedRef.current && time > 0 && !video.ended) return;
    lastReportedRef.current = percent;
    setCurrentTime(time);
    setDuration(dur);
    onPlaybackUpdate?.({ percent, currentTime: time, duration: dur, trackable: true });
  }, [onPlaybackUpdate]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }, []);

  const applySeek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const clamped = Math.min(Math.max(time, 0), video.duration);
    video.currentTime = clamped;
    setCurrentTime(clamped);
    lastReportedRef.current = -1;
    setSeekToken((t) => t + 1);
    reportPlayback(video, true);
  }, [reportPlayback]);

  const changeRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setOpenMenu(null);
  }, []);

  const changeVolume = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const v = Math.min(1, Math.max(0, value));
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (muted || volume === 0) {
      const next = volume > 0 ? volume : 0.5;
      video.muted = false;
      video.volume = next;
      setMuted(false);
      if (volume === 0) setVolume(next);
    } else {
      video.muted = true;
      setMuted(true);
    }
  }, [muted, volume]);

  const closeMenus = useCallback(() => {
    setOpenMenu(null);
  }, []);

  const toggleMenu = useCallback((menu: "rate" | "quality" | "subtitle" | "volume" | "danmaku") => {
    setOpenMenu((m) => (m === menu ? null : menu));
  }, []);

  const patchDanmakuSettings = useCallback((patch: Partial<DanmakuSettings>) => {
    setDanmakuSettings((prev) => {
      const next = { ...prev, ...patch };
      saveDanmakuSettings(next);
      return next;
    });
  }, []);

  const toggleDanmakuEnabled = useCallback(() => {
    setDanmakuSettings((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      saveDanmakuSettings(next);
      return next;
    });
  }, []);

  const sendDanmaku = useCallback(async () => {
    const content = danmakuText.trim();
    if (!content || danmakuSending) return;
    setDanmakuSending(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/danmaku`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          time: currentTime,
          color: danmakuColor,
          mode: danmakuMode,
        }),
      });
      if (!res.ok) return;
      const item = (await res.json()) as DanmakuItem;
      setDanmakus((prev) => [...prev, item].sort((a, b) => a.time - b.time));
      onDanmakuSent?.(item);
      setDanmakuText("");
    } finally {
      setDanmakuSending(false);
    }
  }, [currentTime, danmakuColor, danmakuMode, danmakuSending, danmakuText, onDanmakuSent, resourceId]);

  const handleVolumeClick = useCallback(() => {
    const canHover = typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
    if (!canHover) {
      toggleMenu("volume");
      return;
    }
    toggleMute();
  }, [toggleMute, toggleMenu]);

  const selectQuality = useCallback(async (id: string, height: number | null) => {
    const video = videoRef.current;
    const savedTime = video?.currentTime ?? 0;
    const wasPlaying = video ? !video.paused : false;

    let nextSrc = src;
    if (height !== null) {
      const variant = variantVideoSrc(src, height);
      if (await urlExists(variant)) nextSrc = variant;
    }

    setQualityId(id);
    setActiveSrc(nextSrc);
    setOpenMenu(null);

    requestAnimationFrame(() => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = savedTime;
      if (wasPlaying) void v.play();
    });
  }, [src]);

  const applySubtitle = useCallback((index: number | null) => {
    const video = videoRef.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = index === i ? "showing" : "disabled";
    }
    setActiveSubtitle(index);
    setOpenMenu(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void containerRef.current?.requestFullscreen();
  }, []);

  const displayTime = seeking ? seekValue : currentTime;
  const qualityLabel = QUALITY_OPTIONS.find((q) => q.id === qualityId)?.label ?? "自动";

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-visible bg-black ${fullscreen ? "h-screen" : "aspect-video"}`}
      onClick={closeMenus}
    >
      <video
        ref={videoRef}
        key={activeSrc}
        src={activeSrc}
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full cursor-pointer object-contain"
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setNativeHeight(v.videoHeight || 0);
          v.playbackRate = playbackRate;
          v.volume = volume;
          v.muted = muted;
          reportPlayback(v, true);
        }}
        onTimeUpdate={(e) => {
          if (!seeking) {
            setCurrentTime(e.currentTarget.currentTime);
            reportPlayback(e.currentTarget);
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onSeeked={(e) => reportPlayback(e.currentTarget, true)}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onEnded={() => {
          const video = videoRef.current;
          if (video && Number.isFinite(video.duration) && video.duration > 0) {
            onPlaybackUpdate?.({
              percent: 100,
              currentTime: video.duration,
              duration: video.duration,
              trackable: true,
            });
          }
          setPlaying(false);
          onEnded?.();
        }}
      >
        {subtitleTracks.map((track) => (
          <track key={track.src} kind="subtitles" src={track.src} srcLang={track.lang} label={track.label} />
        ))}
        您的浏览器不支持视频播放
      </video>

      <DanmakuOverlay
        items={danmakus}
        currentTime={displayTime}
        playing={playing}
        playbackRate={playbackRate}
        settings={danmakuSettings}
        seekToken={seekToken}
      />

      {!playing && currentTime === 0 ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/20"
          aria-label="播放视频"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <Play className="ml-1 h-7 w-7 text-primary" />
          </span>
        </button>
      ) : null}

      <div
        className="absolute inset-x-0 bottom-0 z-20 overflow-visible bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-3 pt-10"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={displayTime}
          disabled={!duration}
          onMouseDown={() => { setSeeking(true); setSeekValue(currentTime); }}
          onTouchStart={() => { setSeeking(true); setSeekValue(currentTime); }}
          onChange={(e) => setSeekValue(parseFloat(e.target.value))}
          onMouseUp={() => { applySeek(seekValue); setSeeking(false); }}
          onTouchEnd={() => { applySeek(seekValue); setSeeking(false); }}
          className="mb-2 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-primary disabled:opacity-40 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          aria-label="视频进度"
        />

        <div className="flex flex-wrap items-center gap-2 text-white sm:gap-3">
          <button type="button" onClick={togglePlay} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white/15" aria-label={playing ? "暂停" : "播放"}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>

          <span className="shrink-0 text-xs tabular-nums text-white/90">
            {formatVideoTime(displayTime)} / {formatVideoTime(duration)}
          </span>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleDanmakuEnabled(); }}
            className={`player-danmaku-toggle shrink-0${danmakuSettings.enabled ? " is-on" : ""}`}
            aria-label={danmakuSettings.enabled ? "关闭弹幕" : "开启弹幕"}
            title={danmakuSettings.enabled ? "关闭弹幕" : "开启弹幕"}
          >
            弹
          </button>

          {fullscreen ? (
            <>
              <div className="player-danmaku-inline min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={danmakuText}
                  maxLength={100}
                  placeholder="发条友善的弹幕见证当下"
                  className="player-danmaku-input"
                  onChange={(e) => setDanmakuText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendDanmaku();
                    }
                  }}
                />
                <button
                  type="button"
                  className="player-danmaku-send-inline"
                  disabled={!danmakuText.trim() || danmakuSending}
                  onClick={() => void sendDanmaku()}
                >
                  发送
                </button>
              </div>

              <div className="player-control shrink-0">
                <DanmakuSettingsPanel
                  open={openMenu === "danmaku"}
                  settings={danmakuSettings}
                  onChange={patchDanmakuSettings}
                  mode={danmakuMode}
                  onModeChange={setDanmakuMode}
                  color={danmakuColor}
                  onColorChange={setDanmakuColor}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMenu("danmaku"); }}
                  className={`flex h-8 w-8 items-center justify-center rounded hover:bg-white/15 ${openMenu === "danmaku" ? "text-[#00a1d6]" : "text-white"}`}
                  aria-label="弹幕设置"
                  title="弹幕设置"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : null}

          <div className="ml-auto flex flex-wrap items-center gap-0.5 sm:gap-1">
            {/* 字幕：悬停或点击弹出 */}
            <div className="player-control">
              <VerticalSubtitlePanel
                open={openMenu === "subtitle"}
                activeSubtitle={activeSubtitle}
                tracks={subtitleTracks}
                onSelect={applySubtitle}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleMenu("subtitle"); }}
                className={`flex h-8 items-center gap-1 rounded px-2 text-sm hover:bg-white/15 ${openMenu === "subtitle" || activeSubtitle !== null ? "text-[#00a1d6]" : "text-white"}`}
              >
                <Captions className="h-4 w-4" />
                <span className="hidden sm:inline">字幕</span>
              </button>
            </div>

            {/* 音量：悬停弹出滑块，桌面点击静音 / 触摸点击弹出 */}
            <div className="player-control">
              <VerticalVolumePanel
                open={openMenu === "volume"}
                volume={volume}
                muted={muted}
                onChange={changeVolume}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleVolumeClick(); }}
                className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/15"
                aria-label={muted ? "取消静音" : "音量"}
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>

            {/* 清晰度：悬停或点击弹出 */}
            <div className="player-control">
              <VerticalQualityPanel
                open={openMenu === "quality"}
                qualityId={qualityId}
                nativeHeight={nativeHeight}
                onSelect={selectQuality}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleMenu("quality"); }}
                className={`h-8 rounded px-2 text-sm hover:bg-white/15 ${openMenu === "quality" ? "text-[#00a1d6]" : "text-white"}`}
              >
                {qualityLabel}
              </button>
            </div>

            {/* 倍速：悬停或点击弹出 */}
            <div className="player-control">
              <VerticalRatePanel
                open={openMenu === "rate"}
                rate={playbackRate}
                onSelect={changeRate}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleMenu("rate"); }}
                className={`h-8 rounded px-2 text-sm hover:bg-white/15 ${openMenu === "rate" || playbackRate !== 1 ? "text-[#00a1d6]" : "text-white"}`}
              >
                倍速
              </button>
            </div>

            {/* 全屏 */}
            <button type="button" onClick={toggleFullscreen} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15" aria-label={fullscreen ? "退出全屏" : "全屏"}>
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceVideoPlayer({
  url,
  title,
  playerKey,
  resourceId,
  onEnded,
  onPlaybackUpdate,
  danmakuRefreshKey,
  onDanmakuSent,
}: {
  url: string | null;
  title: string;
  playerKey: string;
  resourceId: string;
  onEnded?: () => void;
  onPlaybackUpdate?: (payload: {
    percent: number;
    currentTime: number;
    duration: number;
    trackable: boolean;
  }) => void;
  danmakuRefreshKey?: number;
  onDanmakuSent?: (item: DanmakuItem) => void;
}) {
  const embed = resolveVideoEmbed(url);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    setIframeReady(false);
  }, [playerKey]);

  useEffect(() => {
    if (embed?.kind !== "native") {
      onPlaybackUpdate?.({ percent: 0, currentTime: 0, duration: 0, trackable: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed?.kind, playerKey]);

  if (!embed) {
    return (
      <div className="relative flex aspect-video w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="px-6 text-center">
          <Video className="mx-auto mb-3 h-12 w-12 text-white/30" />
          <p className="text-sm text-white/60">暂无视频，请联系管理员补充链接</p>
        </div>
      </div>
    );
  }

  if (embed.kind === "native") {
    return (
      <NativeVideoPlayer
        src={embed.src}
        title={title}
        playerKey={playerKey}
        resourceId={resourceId}
        onEnded={onEnded}
        onPlaybackUpdate={onPlaybackUpdate}
        danmakuRefreshKey={danmakuRefreshKey}
        onDanmakuSent={onDanmakuSent}
      />
    );
  }

  if (!iframeReady) {
    return (
      <button
        type="button"
        onClick={() => setIframeReady(true)}
        className="group relative flex aspect-video w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        aria-label="开始播放视频"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)]" />
        <div className="relative flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-105">
            <Play className="ml-1 h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-white/90">点击开始播放</p>
          <p className="text-xs text-white/50">视频将在本页播放；进度与倍速请在播放器内调节</p>
        </div>
      </button>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={embed.src}
        title={title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
}

export function ResourceDetail({
  resource,
  userId,
  isAdmin,
  interaction,
  episodeProgress: initialEpisodeProgress = {},
  playlist = [],
  stats,
  initialEpIndex = 0,
  isVideoResource: isVideoResourceProp,
}: {
  resource: Resource;
  userId: string;
  isAdmin: boolean;
  interaction?: Interaction;
  episodeProgress?: EpisodeProgressMap;
  playlist?: VideoPlaylistItem[];
  stats?: LearningStats;
  initialEpIndex?: number;
  isVideoResource?: boolean;
}) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(resource.comments);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [liked, setLiked] = useState(interaction?.liked ?? false);
  const [favorited, setFavorited] = useState(interaction?.favorited ?? false);
  const [progress, setProgress] = useState(interaction?.progress ?? 0);
  const [completed, setCompleted] = useState(interaction?.completed ?? false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTrackable, setVideoTrackable] = useState(false);
  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);
  const [danmakuRefreshKey, setDanmakuRefreshKey] = useState(0);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deletingDanmakuId, setDeletingDanmakuId] = useState<string | null>(null);
  const [episodeProgressMap, setEpisodeProgressMap] = useState(initialEpisodeProgress);
  const viewStartRef = useRef(Date.now());
  const viewLoggedRef = useRef(false);
  const lastSavedProgressRef = useRef(interaction?.progress ?? 0);
  const saveProgressTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 选集模式解析
  const playlistVideos = useMemo(() => {
    if (!resource.isPlaylist || !resource.playlistItems) return [];
    try {
      const items = JSON.parse(resource.playlistItems) as { id: string; title: string; videoUrl: string }[];
      return items.map((item, idx) => ({
        ...item,
        id: stableEpisodeId(resource.id, idx, item.id),
      }));
    } catch {
      return [];
    }
  }, [resource.isPlaylist, resource.playlistItems, resource.id]);

  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(initialEpIndex);

  useEffect(() => {
    setCurrentPlaylistIndex(initialEpIndex);
  }, [initialEpIndex, resource.id]);

  useEffect(() => {
    setEpisodeProgressMap(initialEpisodeProgress);
  }, [initialEpisodeProgress, resource.id]);

  const currentEpisodeId = playlistVideos[currentPlaylistIndex]?.id;
  const currentVideoUrl = playlistVideos.length > 0
    ? playlistVideos[currentPlaylistIndex]?.videoUrl
    : resource.videoUrl;
  const currentVideoTitle = playlistVideos.length > 0
    ? playlistVideos[currentPlaylistIndex]?.title
    : resource.title;

  useEffect(() => {
    if (!resource.isPlaylist || !currentEpisodeId) return;
    const fromMap = episodeProgressMap[currentEpisodeId];
    const fromPlaylist = playlist[currentPlaylistIndex];
    const nextProgress = fromMap?.progress ?? fromPlaylist?.progress ?? 0;
    const nextCompleted = fromMap?.completed ?? fromPlaylist?.completed ?? false;
    setProgress(nextProgress);
    setCompleted(nextCompleted);
    lastSavedProgressRef.current = nextProgress;
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }, [resource.isPlaylist, currentEpisodeId, currentPlaylistIndex, episodeProgressMap, playlist]);

  useEffect(() => {
    if (viewLoggedRef.current) return;
    viewLoggedRef.current = true;
    fetch("/api/profile/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: resource.id, duration: 0 }),
    }).catch(() => {});

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - viewStartRef.current) / 1000);
      if (elapsed >= 30) {
        viewStartRef.current = Date.now();
        fetch("/api/profile/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId: resource.id, duration: 30 }),
        }).catch(() => {});
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      const elapsed = Math.floor((Date.now() - viewStartRef.current) / 1000);
      if (elapsed > 5) {
        fetch("/api/profile/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId: resource.id, duration: elapsed }),
        }).catch(() => {});
      }
    };
  }, [resource.id]);

  async function patchInteraction(data: Partial<Interaction> & { episodeId?: string }) {
    const res = await fetch(`/api/profile/resources/${resource.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setLiked(updated.liked);
      setFavorited(updated.favorited);
      if (resource.isPlaylist && data.episodeId) {
        try {
          const map = JSON.parse(updated.episodeProgress || "{}") as EpisodeProgressMap;
          setEpisodeProgressMap(map);
          const ep = map[data.episodeId];
          if (ep) {
            setProgress(ep.progress);
            setCompleted(ep.completed);
            lastSavedProgressRef.current = ep.progress;
          }
        } catch {
          /* ignore */
        }
        if (typeof updated.progress === "number") {
          setProgress(updated.progress);
        }
        if (typeof updated.completed === "boolean") {
          setCompleted(updated.completed);
        }
      } else {
        setProgress(updated.progress);
        setCompleted(updated.completed);
        lastSavedProgressRef.current = updated.progress;
      }
    }
  }

  async function toggleLike() {
    await patchInteraction({ liked: !liked });
  }

  async function toggleFavorite() {
    await patchInteraction({ favorited: !favorited });
  }

  async function handleProgressChange(value: number) {
    setProgress(value);
    if (value >= 100) setCompleted(true);
  }

  async function handleProgressSave(value: number) {
    const done = value >= 100;
    setProgress(value);
    if (done) setCompleted(true);
    lastSavedProgressRef.current = Math.max(lastSavedProgressRef.current, value);
    if (resource.isPlaylist && currentEpisodeId) {
      await patchInteraction({ episodeId: currentEpisodeId, progress: value, completed: done });
    } else {
      await patchInteraction({ progress: value, completed: done });
    }
  }

  const handleProgressSaveRef = useRef(handleProgressSave);
  handleProgressSaveRef.current = handleProgressSave;

  const scheduleProgressSave = useCallback((value: number) => {
    if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
    saveProgressTimerRef.current = setTimeout(() => {
      if (value > lastSavedProgressRef.current) {
        void handleProgressSaveRef.current(value);
      }
    }, 3000);
  }, []);

  const handlePlaybackUpdate = useCallback((payload: {
    percent: number;
    currentTime: number;
    duration: number;
    trackable: boolean;
  }) => {
    setVideoTrackable(payload.trackable);
    setVideoCurrentTime(payload.currentTime);
    setVideoDuration(payload.duration);

    if (!payload.trackable) return;

    const livePercent = payload.percent;
    setProgress(livePercent);
    if (livePercent >= 100) setCompleted(true);

    if (livePercent >= 100) {
      void handleProgressSaveRef.current(100);
      return;
    }

    if (livePercent > lastSavedProgressRef.current) {
      scheduleProgressSave(livePercent);
    }
  }, [scheduleProgressSave]);

  useEffect(() => {
    return () => {
      if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (resource.isPlaylist) return;
    lastSavedProgressRef.current = interaction?.progress ?? 0;
    setProgress(interaction?.progress ?? 0);
    setCompleted(interaction?.completed ?? false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }, [resource.id, resource.isPlaylist, interaction?.progress, interaction?.completed]);

  async function markVideoCompleted() {
    setProgress(100);
    setCompleted(true);
    if (resource.isPlaylist && currentEpisodeId) {
      await patchInteraction({ episodeId: currentEpisodeId, progress: 100, completed: true });
    } else {
      await patchInteraction({ progress: 100, completed: true });
    }
  }

  const cat = getCategoryMeta(resource.category);
  const typeInfo =
    RESOURCE_TYPES[resource.type as ResourceTypeKey] ?? {
      label: getResourceTypeLabel(resource.type),
      icon: "File",
    };
  const isVideoResource =
    isVideoResourceProp ??
    (resource.type === "VIDEO" || resource.type === "COURSE_VIDEO");
  const canDeleteContent = (ownerId: string) => isAdmin || ownerId === userId;
  const visibleDanmakus = isAdmin
    ? danmakuList
    : danmakuList.filter((d) => d.user.id === userId);
  const canDownload = resource.type === "TEMPLATE" && resource.filePath;
  const canPreview =
    canDownload &&
    resource.fileName &&
    /\.(c|h|cpp|py|js|ts|txt|md|json|ino)$/i.test(resource.fileName);

  async function handleDownload() {
    window.location.href = `/api/resources/${resource.id}/download`;
  }

  async function handlePreview() {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/resources/${resource.id}/preview`);
      const data = await res.json();
      if (res.ok) setPreview(data.content);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;

    const res = await fetch(`/api/resources/${resource.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setComment("");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("确定删除这条评论？")) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/resources/${resource.id}/comments?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleDeleteDanmaku(danmakuId: string) {
    if (!confirm("确定删除这条弹幕？")) return;
    setDeletingDanmakuId(danmakuId);
    try {
      const res = await fetch(`/api/resources/${resource.id}/danmaku?danmakuId=${danmakuId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDanmakuList((prev) => prev.filter((d) => d.id !== danmakuId));
        setDanmakuRefreshKey((k) => k + 1);
      }
    } finally {
      setDeletingDanmakuId(null);
    }
  }

  const handleDanmakuSent = useCallback((item: DanmakuItem) => {
    setDanmakuList((prev) => {
      if (prev.some((d) => d.id === item.id)) return prev;
      return [...prev, item].sort((a, b) => a.time - b.time);
    });
  }, []);

  useEffect(() => {
    const isVideo = resource.type === "VIDEO" || resource.type === "COURSE_VIDEO";
    if (!isVideo) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/resources/${resource.id}/danmaku?from=0&to=999999`);
        if (!res.ok) return;
        const data = (await res.json()) as DanmakuItem[];
        if (!cancelled) setDanmakuList(data);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [resource.id, resource.type, danmakuRefreshKey]);

  async function handleApprove(status: "APPROVED" | "REJECTED") {
    await fetch(`/api/resources/${resource.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {isVideoResource ? (
        <>
          {/* ① 视频标题区 */}
          <GznuPanel className="p-5 md:p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className={`${cat?.color} text-white`}>{cat?.label}</Badge>
              <Badge className="bg-gray-100 text-gray-700">{typeInfo?.label}</Badge>
              {resource.status !== "APPROVED" && (
                <Badge
                  className={
                    resource.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                  }
                >
                  {resource.status === "PENDING" ? "待审核" : "已拒绝"}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{resource.title}</h1>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <User className="h-4 w-4" />
                上传者：{resource.author.name}
              </span>
              <span>
                发布时间：{new Date(resource.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
            {resource.description ? (
              <div className="mt-4 rounded-lg bg-[#f8fafc] p-4">
                <p className="mb-1 text-xs font-medium text-gray-500">课程简介</p>
                <p className="text-sm leading-relaxed text-gray-600">{resource.description}</p>
              </div>
            ) : null}
          </GznuPanel>

          {/* ② 视频观看区 */}
          {stats && playlist.length > 0 ? (
            <div className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">课程整体进度</span>
                <span className="font-bold text-primary">
                  {Math.round((stats.completedVideos / playlist.length) * 100)}%
                  <span className="ml-1 font-normal text-gray-400">
                    ({stats.completedVideos}/{playlist.length})
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                  style={{ width: `${Math.round((stats.completedVideos / playlist.length) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* 选集模式由侧边栏展示，单视频分类选集亦在侧边栏 */}

          <GznuPanel className="overflow-visible p-0">
            <ResourceVideoPlayer
              key={resource.isPlaylist ? `${resource.id}-ep-${currentPlaylistIndex}` : resource.id}
              playerKey={resource.isPlaylist ? `${resource.id}-ep-${currentPlaylistIndex}` : resource.id}
              resourceId={resource.id}
              url={currentVideoUrl}
              title={currentVideoTitle}
              onPlaybackUpdate={handlePlaybackUpdate}
              onEnded={markVideoCompleted}
              danmakuRefreshKey={danmakuRefreshKey}
              onDanmakuSent={handleDanmakuSent}
            />
          </GznuPanel>

          {/* ③ 点赞 · 收藏 · 评论区 */}
          <GznuPanel className="p-5 md:p-6">
            <VideoSection title="点赞 · 收藏 · 评论" icon={MessageSquare}>
              <div className="mb-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={toggleLike}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm border rounded-lg transition-colors ${
                    liked ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-600 hover:border-red-200"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                  {liked ? "已点赞" : "点赞"}
                </button>
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm border rounded-lg transition-colors ${
                    favorited ? "border-amber-200 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-600 hover:border-amber-200"
                  }`}
                >
                  <Star className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
                  {favorited ? "已收藏" : "收藏"}
                </button>
                {isAdmin && resource.status === "PENDING" && (
                  <>
                    <Button variant="secondary" onClick={() => handleApprove("APPROVED")}>
                      <Check className="w-4 h-4" />
                      通过审核
                    </Button>
                    <Button variant="danger" onClick={() => handleApprove("REJECTED")}>
                      <X className="w-4 h-4" />
                      拒绝
                    </Button>
                  </>
                )}
              </div>

              <form onSubmit={handleComment} className="mb-5">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="写下你的学习心得或疑问..."
                  rows={3}
                  className="mb-3 w-full border border-gray-200 px-4 py-3 text-sm focus:border-primary focus-visible:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <Button type="submit" size="sm">
                  发表评论
                </Button>
              </form>

              <div className="space-y-1 border-t border-gray-50 pt-4">
                {comments.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">暂无评论，来发表第一条吧</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="gznu-list-item flex-col !items-start !gap-1 border-b border-gray-50 last:border-0"
                    >
                      <div className="mb-1 flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{c.user.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        {canDeleteContent(c.user.id) ? (
                          <button
                            type="button"
                            onClick={() => void handleDeleteComment(c.id)}
                            disabled={deletingCommentId === c.id}
                            className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除
                          </button>
                        ) : null}
                      </div>
                      <p className="text-sm text-gray-600">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {isVideoResource ? (
                <div className="mt-6 border-t border-gray-50 pt-4">
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    {isAdmin ? "弹幕管理" : "我的弹幕"}
                  </h4>
                  {visibleDanmakus.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">
                      {isAdmin ? "暂无弹幕" : "你还没有发送过弹幕"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {visibleDanmakus.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-[#f8fafc] px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                              {isAdmin ? (
                                <span className="font-medium text-gray-600">{d.user.name}</span>
                              ) : null}
                              <span>{formatVideoTime(d.time)}</span>
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: d.color }}
                                aria-hidden
                              />
                            </div>
                            <p className="text-sm text-gray-700">{d.content}</p>
                          </div>
                          {canDeleteContent(d.user.id) ? (
                            <button
                              type="button"
                              onClick={() => void handleDeleteDanmaku(d.id)}
                              disabled={deletingDanmakuId === d.id}
                              className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              删除
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </VideoSection>
          </GznuPanel>

          {/* ④ 学习进度条 */}
          {stats ? (
            <LearningExperiencePanel
              userId={userId}
              currentVideoId={currentEpisodeId ?? resource.id}
              currentVideoTitle={currentVideoTitle}
              playlist={playlist}
              stats={stats}
              progress={progress}
              videoCurrentTime={videoCurrentTime}
              videoDuration={videoDuration}
              videoTrackable={videoTrackable}
              onVideoComplete={markVideoCompleted}
            />
          ) : (
            <GznuPanel className="p-5 md:p-6">
              <VideoSection title="学习进度" icon={Gauge}>
                <div className="rounded-lg border border-gray-100 bg-[#f8fafc] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {completed ? "本讲已学完" : "拖动进度条标记学习完成度"}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {completed ? "100%" : `${progress}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(e) => handleProgressChange(parseInt(e.target.value, 10))}
                    onMouseUp={() => handleProgressSave(progress)}
                    onTouchEnd={() => handleProgressSave(progress)}
                    className="h-2 w-full cursor-pointer accent-primary"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">进度将同步至个人中心</p>
                    {!completed ? (
                      <button
                        type="button"
                        onClick={markVideoCompleted}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        标记为已学完
                      </button>
                    ) : null}
                  </div>
                </div>
              </VideoSection>
            </GznuPanel>
          )}
        </>
      ) : (
      <GznuPanel className="p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={`${cat?.color} text-white`}>{cat?.label}</Badge>
          <Badge className="bg-gray-100 text-gray-700">{typeInfo?.label}</Badge>
          {resource.status !== "APPROVED" && (
            <Badge className={resource.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
              {resource.status === "PENDING" ? "待审核" : "已拒绝"}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{resource.title}</h1>
        {resource.description && (
          <p className="text-gray-600 leading-relaxed mb-4">{resource.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          <span>上传者：{resource.author.name}</span>
          {resource.competition && <span>比赛：{resource.competition}</span>}
          {resource.year && <span>年份：{resource.year}</span>}
          {resource.fileName && (
            <span className="flex items-center gap-1">
              <FileCode className="w-4 h-4" />
              {resource.fileName}
              {resource.fileSize && ` (${formatFileSize(resource.fileSize)})`}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={toggleLike}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border transition-colors ${
              liked ? "border-red-200 bg-red-50 text-red-600" : "border-gray-200 text-gray-600 hover:border-red-200"
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            {liked ? "已喜欢" : "喜欢"}
          </button>
          <button
            type="button"
            onClick={toggleFavorite}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border transition-colors ${
              favorited ? "border-amber-200 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-600 hover:border-amber-200"
            }`}
          >
            <Star className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
            {favorited ? "已收藏" : "收藏"}
          </button>

          {canDownload && (
            <>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4" />
                下载程序
              </Button>
              {canPreview ? (
                <Button variant="outline" onClick={handlePreview} disabled={loadingPreview}>
                  <Eye className="w-4 h-4" />
                  {loadingPreview ? "加载中..." : "预览代码"}
                </Button>
              ) : null}
            </>
          )}

          {isAdmin && resource.status === "PENDING" && (
            <>
              <Button variant="secondary" onClick={() => handleApprove("APPROVED")}>
                <Check className="w-4 h-4" />
                通过审核
              </Button>
              <Button variant="danger" onClick={() => handleApprove("REJECTED")}>
                <X className="w-4 h-4" />
                拒绝
              </Button>
            </>
          )}
        </div>
      </GznuPanel>
      )}

      {preview && (
        <GznuPanel>
          <GznuSectionHead title="代码预览" />
          <div className="p-5">
            <button type="button" onClick={() => setPreview(null)} className="text-xs text-gray-500 hover:text-gray-700 mb-3 block ml-auto">
              关闭预览
            </button>
            <pre className="code-preview bg-primary-dark text-blue-100 p-4 overflow-auto max-h-96 text-sm">
              {preview}
            </pre>
          </div>
        </GznuPanel>
      )}

      {!isVideoResource ? (
      <GznuPanel>
        <GznuSectionHead title={`评论 (${comments.length})`} />
        <div className="p-5">
          <form onSubmit={handleComment} className="mb-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 text-sm focus-visible:outline-none focus:border-primary mb-3"
          />
          <Button type="submit" size="sm">发表评论</Button>
        </form>

        <div className="space-y-1">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">暂无评论</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="gznu-list-item border-b border-gray-50 last:border-0 flex-col !items-start !gap-1">
                <div className="mb-1 flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{c.user.name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  {canDeleteContent(c.user.id) ? (
                    <button
                      type="button"
                      onClick={() => void handleDeleteComment(c.id)}
                      disabled={deletingCommentId === c.id}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  ) : null}
                </div>
                <p className="text-gray-600 text-sm">{c.content}</p>
              </div>
            ))
          )}
        </div>
        </div>
      </GznuPanel>
      ) : null}
    </div>
  );
}
