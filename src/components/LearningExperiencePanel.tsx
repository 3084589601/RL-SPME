"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Trophy, Medal, Star, Flame, Target, Zap, Crown,
  CheckCircle2, Twitter, Facebook, Link2, Clock,
  Video, TrendingUp, Rocket, Sparkles, PartyPopper,
  GraduationCap, BarChart3, Milestone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuSectionHead } from "@/components/GznuSectionHead";
import { Button } from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { Badge } from "@/components/ui/Card";

/* ---------- 类型定义 ---------- */
interface VideoItem {
  id: string;
  title: string;
  progress: number;
  completed: boolean;
}

interface LearningStats {
  totalVideos: number;
  completedVideos: number;
  totalDuration: number; // 秒
  studyDays: number;
  currentStreak: number;
  todayCompletedVideos?: number;
  courseComplete?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  unlockedAt?: string;
  category: "progress" | "streak" | "milestone" | "social";
}

interface LearningGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  type: "videos" | "duration" | "days";
}

interface Milestone {
  id: string;
  threshold: number;
  title: string;
  description: string;
  achieved: boolean;
}

/* ---------- 徽章定义 ---------- */
const ACHIEVEMENTS: Achievement[] = [
  { id: "first_video", title: "初学者", description: "完成第一个视频学习", icon: Rocket, category: "progress" },
  { id: "five_videos", title: "小试牛刀", description: "完成5个视频学习", icon: Star, category: "progress" },
  { id: "ten_videos", title: "学习达人", description: "完成10个视频学习", icon: Trophy, category: "progress" },
  { id: "twenty_videos", title: "学习高手", description: "完成20个视频学习", icon: Medal, category: "progress" },
  { id: "first_week", title: "坚持一周", description: "连续学习7天", icon: Flame, category: "streak" },
  { id: "first_month", title: "一月坚持", description: "连续学习30天", icon: Crown, category: "streak" },
  { id: "course_complete", title: "课程毕业", description: "完成整个课程学习", icon: GraduationCap, category: "milestone" },
  { id: "speed_learner", title: "闪电学习", description: "一天内完成3个视频", icon: Zap, category: "milestone" },
];

const DEFAULT_GOALS: LearningGoal[] = [
  { id: "daily_videos", title: "每日视频", target: 2, current: 0, unit: "个", type: "videos" },
  { id: "weekly_hours", title: "本周学习", target: 5, current: 0, unit: "小时", type: "duration" },
  { id: "streak_days", title: "连续学习", target: 7, current: 0, unit: "天", type: "days" },
];

const MILESTONES: Milestone[] = [
  { id: "m25", threshold: 25, title: "四分之一", description: "完成课程进度的25%", achieved: false },
  { id: "m50", threshold: 50, title: "半程", description: "完成课程进度的50%", achieved: false },
  { id: "m75", threshold: 75, title: "最后冲刺", description: "完成课程进度的75%", achieved: false },
  { id: "m100", threshold: 100, title: "全部完成", description: "完成全部课程学习", achieved: false },
];

/* ---------- 工具函数 ---------- */
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

function getAchievementProgress(stats: LearningStats): Achievement[] {
  const {
    completedVideos,
    currentStreak,
    courseComplete,
    todayCompletedVideos = 0,
  } = stats;

  return ACHIEVEMENTS.map((a) => {
    let achieved = false;
    switch (a.id) {
      case "first_video": achieved = completedVideos >= 1; break;
      case "five_videos": achieved = completedVideos >= 5; break;
      case "ten_videos": achieved = completedVideos >= 10; break;
      case "twenty_videos": achieved = completedVideos >= 20; break;
      case "first_week": achieved = currentStreak >= 7; break;
      case "first_month": achieved = currentStreak >= 30; break;
      case "course_complete": achieved = Boolean(courseComplete); break;
      case "speed_learner": achieved = todayCompletedVideos >= 3; break;
    }
    return { ...a, unlockedAt: achieved ? new Date().toISOString() : undefined };
  });
}

function loadGoals(userId: string, stats: LearningStats): LearningGoal[] {
  if (typeof window === "undefined") {
    return DEFAULT_GOALS.map((g) => ({
      ...g,
      current:
        g.type === "videos" ? stats.completedVideos :
        g.type === "duration" ? Math.floor(stats.totalDuration / 3600) :
        stats.currentStreak,
    }));
  }

  try {
    const saved = localStorage.getItem(`learning-goals-${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved) as LearningGoal[];
      return parsed.map((g) => ({
        ...g,
        current:
          g.type === "videos" ? stats.completedVideos :
          g.type === "duration" ? Math.floor(stats.totalDuration / 3600) :
          stats.currentStreak,
      }));
    }
  } catch {
    /* ignore */
  }

  return DEFAULT_GOALS.map((g) => ({
    ...g,
    current:
      g.type === "videos" ? stats.completedVideos :
      g.type === "duration" ? Math.floor(stats.totalDuration / 3600) :
      stats.currentStreak,
  }));
}

/* ---------- 成就解锁动画组件 ---------- */
function AchievementUnlock({ achievement, onClose }: { achievement: Achievement; onClose: () => void }) {
  const Icon = achievement.icon;
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div
        ref={ref}
        className="mx-4 w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-2xl animate-scale-in md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 animate-bounce">
          <Icon className="h-14 w-14 text-white" />
        </div>
        <h3 className="mb-3 text-2xl font-bold text-amber-600">成就解锁！</h3>
        <h4 className="mb-3 text-3xl font-bold text-gray-900">{achievement.title}</h4>
        <p className="mb-8 text-base leading-relaxed text-gray-500">{achievement.description}</p>
        <Button onClick={onClose}>太棒了！</Button>
      </div>
    </div>
  );
}

/* ---------- 进度条组件 ---------- */
function ProgressRing({ progress, size = 120, strokeWidth = 8 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1565c0" />
            <stop offset="100%" stopColor="#42a5f5" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">{progress}%</span>
      </div>
    </div>
  );
}

/* ---------- 学习目标卡片 ---------- */
function GoalCard({
  goal,
  onTargetChange,
}: {
  goal: LearningGoal;
  onTargetChange: (id: string, target: number) => void;
}) {
  const percentage = Math.min((goal.current / goal.target) * 100, 100);
  const isCompleted = goal.current >= goal.target;

  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      isCompleted ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className={cn("w-4 h-4", isCompleted ? "text-green-600" : "text-primary")} />
          <span className="font-medium text-gray-900 text-sm">{goal.title}</span>
        </div>
        {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-primary">{goal.current}</span>
        <span className="text-gray-400">/</span>
        <label className="inline-flex items-center gap-1 text-gray-500">
          <input
            type="number"
            min={1}
            value={goal.target}
            onChange={(e) => onTargetChange(goal.id, Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center text-sm text-gray-700 focus:border-primary focus-visible:outline-none"
          />
          {goal.unit}
        </label>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isCompleted ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isCompleted ? (
        <p className="mt-2 text-xs text-green-600">目标已达成，继续保持！</p>
      ) : (
        <p className="mt-2 text-xs text-gray-400">还可修改目标数值</p>
      )}
    </div>
  );
}

/* ---------- 成就徽章网格 ---------- */
function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {achievements.map((a) => {
        const Icon = a.icon;
        const unlocked = !!a.unlockedAt;
        return (
          <div
            key={a.id}
            className={cn(
              "flex flex-col items-center p-3 rounded-xl transition-all",
              unlocked
                ? "bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300"
                : "bg-gray-50 border border-gray-200 opacity-50"
            )}
            title={a.description}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center mb-1",
              unlocked ? "bg-amber-400" : "bg-gray-300"
            )}>
              <Icon className={cn("w-5 h-5", unlocked ? "text-white" : "text-gray-500")} />
            </div>
            <span className={cn(
              "text-xs font-medium text-center",
              unlocked ? "text-amber-700" : "text-gray-400"
            )}>
              {a.title}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 视频列表项 ---------- */
function VideoListItem({ video, index, isActive }: { video: VideoItem; index: number; isActive: boolean }) {
  return (
    <Link
      href={`/resources/${video.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-gray-50 border border-transparent"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
        video.completed
          ? "bg-green-500 text-white"
          : isActive
            ? "bg-primary text-white"
            : "bg-gray-200 text-gray-600"
      )}>
        {video.completed ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isActive ? "text-primary" : "text-gray-700"
        )}>
          {video.title}
        </p>
        {video.progress > 0 && !video.completed && (
          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${video.progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ---------- 统计卡片 ---------- */
function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: typeof Clock; label: string; value: string; subValue?: string; color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  );
}

/* ---------- 分享按钮组 ---------- */
function ShareButtons({ title, onCopied }: { title: string; onCopied: () => void }) {
  const [showCopyTip, setShowCopyTip] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setShowCopyTip(true);
    onCopied();
    setTimeout(() => setShowCopyTip(false), 2000);
  };

  const shareText = encodeURIComponent(`我在实验室学习平台完成了《${title}》的学习！`);
  const shareUrl = encodeURIComponent(window.location.href);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">分享到：</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
      >
        <Twitter className="w-4 h-4 text-white" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <Facebook className="w-4 h-4 text-white" />
      </a>
      <button
        onClick={handleCopyLink}
        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors relative"
      >
        <Link2 className="w-4 h-4 text-gray-600" />
        {showCopyTip && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            已复制！
          </span>
        )}
      </button>
    </div>
  );
}

/* ---------- 主组件 ---------- */
interface LearningExperiencePanelProps {
  userId: string;
  currentVideoId: string;
  currentVideoTitle: string;
  playlist: VideoItem[];
  stats: LearningStats;
  progress: number;
  videoCurrentTime: number;
  videoDuration: number;
  videoTrackable: boolean;
  onVideoComplete: () => void;
}

function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LearningExperiencePanel({
  userId,
  currentVideoId,
  currentVideoTitle,
  playlist,
  stats,
  progress,
  videoCurrentTime,
  videoDuration,
  videoTrackable,
  onVideoComplete,
}: LearningExperiencePanelProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [goals, setGoals] = useState<LearningGoal[]>(() => loadGoals(userId, stats));
  const [activeTab, setActiveTab] = useState<"progress" | "achievements" | "goals" | "path">("progress");
  const prevVideoProgressRef = useRef(progress);
  const prevCourseProgressRef = useRef(0);
  const seenAchievementsRef = useRef<Set<string>>(new Set());
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const achievements = useMemo(() => getAchievementProgress(stats), [stats]);
  const courseProgress = playlist.length > 0
    ? Math.round((stats.completedVideos / playlist.length) * 100)
    : 0;
  const milestones = useMemo(
    () => MILESTONES.map((m) => ({ ...m, achieved: courseProgress >= m.threshold })),
    [courseProgress]
  );

  useEffect(() => {
    if (progress >= 100 && prevVideoProgressRef.current < 100) {
      setCelebrationMessage("太棒了！你完成了本讲视频的学习！");
      setShowCelebration(true);
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = setTimeout(() => setShowCelebration(false), 3000);
    }
    prevVideoProgressRef.current = progress;
  }, [progress, currentVideoId]);

  useEffect(() => {
    setGoals(loadGoals(userId, stats));
  }, [userId, stats.completedVideos, stats.totalDuration, stats.currentStreak]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = JSON.parse(sessionStorage.getItem(`seen-achievements-${userId}`) || "[]") as string[];
      seenAchievementsRef.current = new Set(seen);
    } catch {
      seenAchievementsRef.current = new Set();
    }

    achievements.forEach((a) => {
      if (a.unlockedAt && !seenAchievementsRef.current.has(a.id)) {
        seenAchievementsRef.current.add(a.id);
        sessionStorage.setItem(
          `seen-achievements-${userId}`,
          JSON.stringify(Array.from(seenAchievementsRef.current))
        );
        setNewAchievement(a);
      }
    });
  }, [achievements, userId]);

  useEffect(() => {
    milestones.forEach((m) => {
      if (m.achieved && prevCourseProgressRef.current < m.threshold) {
        setCelebrationMessage(`恭喜达成里程碑「${m.title}」！${m.description}`);
        setShowCelebration(true);
        if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = setTimeout(() => setShowCelebration(false), 3500);
      }
    });
    prevCourseProgressRef.current = courseProgress;
  }, [courseProgress, milestones]);

  const handleMarkComplete = useCallback(() => {
    onVideoComplete();
  }, [onVideoComplete]);

  const handleGoalTargetChange = useCallback((id: string, target: number) => {
    setGoals((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, target } : g));
      if (typeof window !== "undefined") {
        localStorage.setItem(`learning-goals-${userId}`, JSON.stringify(next));
      }
      return next;
    });
  }, [userId]);

  const closeAchievement = useCallback(() => {
    setNewAchievement(null);
  }, []);

  const handleShareSuccess = useCallback(() => {
    setCelebrationMessage("链接已复制，快去分享你的学习成果吧！");
    setShowCelebration(true);
    if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
    celebrationTimeoutRef.current = setTimeout(() => setShowCelebration(false), 2500);
  }, []);

  const tabs = [
    { key: "progress" as const, label: "学习进度", icon: BarChart3 },
    { key: "achievements" as const, label: "成就", icon: Trophy },
    { key: "goals" as const, label: "学习目标", icon: Target },
    { key: "path" as const, label: "学习路径", icon: Milestone },
  ];

  return (
    <>
      {showCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <PartyPopper className="w-5 h-5" />
            <span className="font-medium">{celebrationMessage}</span>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      )}

      {newAchievement && (
        <AchievementUnlock achievement={newAchievement} onClose={closeAchievement} />
      )}

      <div className="space-y-4">
        {/* 顶部统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={Video}
            label="已完成视频"
            value={`${stats.completedVideos}/${stats.totalVideos}`}
            subValue="个"
            color="bg-blue-500"
          />
          <StatCard
            icon={Clock}
            label="累计学习"
            value={formatDuration(stats.totalDuration)}
            color="bg-primary"
          />
          <StatCard
            icon={Flame}
            label="连续学习"
            value={`${stats.currentStreak}天`}
            subValue={`共${stats.studyDays}天`}
            color="bg-orange-500"
          />
          <StatCard
            icon={TrendingUp}
            label="学习进度"
            value={`${courseProgress}%`}
            color="bg-green-500"
          />
        </div>

        {/* 标签切换 */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeTab === tab.key
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-primary/30"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 学习进度标签页 */}
        {activeTab === "progress" && (
          <GznuPanel className="p-5">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* 环形进度 */}
              <ProgressRing progress={progress} size={140} strokeWidth={10} />

              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">当前视频进度</h3>
                  <p className="text-sm text-gray-500">{currentVideoTitle}</p>
                </div>

                {/* 进度条（随视频播放自动更新） */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {videoTrackable ? "随播放进度自动更新" : "外链视频需手动标记完成"}
                    </span>
                    <span className="font-bold text-primary">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {videoTrackable && videoDuration > 0 ? (
                    <p className="text-xs text-gray-400">
                      已播放 {formatVideoTime(videoCurrentTime)} / 总时长 {formatVideoTime(videoDuration)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      B 站 / YouTube 等外链视频无法读取播放进度，看完请点击下方按钮标记完成
                    </p>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2">
                  {!videoTrackable ? (
                    <Button
                      onClick={handleMarkComplete}
                      variant="secondary"
                      size="sm"
                      disabled={progress >= 100}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      标记为已完成
                    </Button>
                  ) : progress >= 100 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      本讲已学完
                    </span>
                  ) : null}
                  <ShareButtons title={currentVideoTitle} onCopied={handleShareSuccess} />
                </div>
              </div>
            </div>

            {/* 课程整体进度 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">整体课程进度</span>
                <span className="text-sm font-bold text-primary">{courseProgress}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                  style={{ width: `${courseProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                已完成 {stats.completedVideos} 个视频，共 {playlist.length} 个视频
              </p>
            </div>
          </GznuPanel>
        )}

        {/* 成就标签页 */}
        {activeTab === "achievements" && (
          <GznuPanel className="p-5">
            <GznuSectionHead title="我的成就" />
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>已解锁 {achievements.filter(a => a.unlockedAt).length} 个成就</span>
              </div>
            </div>
            <AchievementGrid achievements={achievements} />

            {/* 分享成就按钮 */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">炫耀一下你的学习成就！</p>
              <ShareButtons title={currentVideoTitle} onCopied={handleShareSuccess} />
            </div>
          </GznuPanel>
        )}

        {/* 学习目标标签页 */}
        {activeTab === "goals" && (
          <GznuPanel className="p-5">
            <GznuSectionHead title="学习目标" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onTargetChange={handleGoalTargetChange} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              学习目标帮助您保持学习动力，坚持就是胜利！
            </p>
          </GznuPanel>
        )}

        {/* 学习路径标签页 */}
        {activeTab === "path" && (
          <GznuPanel className="p-5">
            <GznuSectionHead title="课程学习路径" />
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-gray-500">共 {playlist.length} 个视频</span>
              <span className="font-medium text-primary">
                已完成 {playlist.filter(v => v.completed).length} 个
              </span>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {playlist.map((video, index) => (
                <VideoListItem
                  key={video.id}
                  video={video}
                  index={index}
                  isActive={video.id === currentVideoId}
                />
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                <Milestone className="w-4 h-4 text-primary" />
                里程碑进度
              </h4>
              <div className="relative flex items-start justify-between gap-2">
                <div className="absolute left-5 right-5 top-5 h-0.5 bg-gray-200 -z-0" />
                {milestones.map((m) => (
                  <div key={m.id} className="relative z-10 flex flex-1 flex-col items-center text-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      m.achieved
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-white border-2 border-gray-200 text-gray-500"
                    )}>
                      {m.achieved ? <CheckCircle2 className="w-5 h-5" /> : `${m.threshold}%`}
                    </div>
                    <span className={cn("text-xs mt-2 font-medium", m.achieved ? "text-green-600" : "text-gray-500")}>
                      {m.title}
                    </span>
                    {m.achieved ? (
                      <span className="text-[10px] text-green-500 mt-0.5">已达成</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </GznuPanel>
        )}
      </div>
    </>
  );
}
