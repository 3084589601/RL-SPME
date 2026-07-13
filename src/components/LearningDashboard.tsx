"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Clock, Plus, Play, Square } from "lucide-react";
import { TECH_CATEGORIES, formatDuration, getCategoryMeta } from "@/lib/utils";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuSectionHead } from "@/components/GznuSectionHead";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/EmptyState";

interface Session {
  id: string;
  category: keyof typeof TECH_CATEGORIES;
  duration: number;
  date: string | Date;
  note: string | null;
}

interface CategoryStat {
  category: string;
  duration: number;
}

const COLORS = ["#1565c0", "#42a5f5", "#0d47a1", "#64b5f6", "#1976d2", "#90caf9"];

export function LearningDashboard({
  categoryStats,
  totalDuration,
  recentSessions,
  userId,
}: {
  categoryStats: CategoryStat[];
  totalDuration: number;
  recentSessions: Session[];
  userId: string;
}) {
  const router = useRouter();
  const [timerActive, setTimerActive] = useState(false);
  const [timerCategory, setTimerCategory] = useState("EMBEDDED");
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [manualForm, setManualForm] = useState({ category: "EMBEDDED", hours: "1", minutes: "0", note: "" });

  const chartData = categoryStats.map((s) => ({
    name: getCategoryMeta(s.category).label || s.category,
    duration: Math.round(s.duration / 60),
    fullDuration: s.duration,
  }));

  const pieData = categoryStats.map((s) => ({
    name: getCategoryMeta(s.category).label || s.category,
    value: s.duration,
  }));

  function startTimer() {
    setTimerActive(true);
    setTimerStart(Date.now());
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    (window as unknown as { _timerInterval: NodeJS.Timeout })._timerInterval = interval;
  }

  async function stopTimer() {
    if (!timerStart) return;
    clearInterval((window as unknown as { _timerInterval: NodeJS.Timeout })._timerInterval);
    const duration = Math.floor((Date.now() - timerStart) / 1000);
    if (duration > 0) {
      await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: timerCategory, duration }),
      });
      router.refresh();
    }
    setTimerActive(false);
    setTimerStart(null);
    setElapsed(0);
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    const duration = parseInt(manualForm.hours) * 3600 + parseInt(manualForm.minutes) * 60;
    if (duration <= 0) return;

    await fetch("/api/study", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: manualForm.category,
        duration,
        note: manualForm.note,
      }),
    });

    setShowAdd(false);
    router.refresh();
  }

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GznuPanel className="p-5 md:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-gray-500">累计学习时长</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(totalDuration)}</p>
            </div>
          </div>
        </GznuPanel>

        <GznuPanel className="md:col-span-2 overflow-hidden">
          <GznuSectionHead title="学习计时器" />
          <div className="px-5 pb-5 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
            <select
              value={timerCategory}
              onChange={(e) => setTimerCategory(e.target.value)}
              disabled={timerActive}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {Object.entries(TECH_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>

            <span className="text-3xl font-mono font-bold text-primary">
              {formatTimer(elapsed)}
            </span>

            {!timerActive ? (
              <Button onClick={startTimer} variant="secondary" size="sm">
                <Play className="w-4 h-4" />
                开始学习
              </Button>
            ) : (
              <Button onClick={stopTimer} variant="danger" size="sm">
                <Square className="w-4 h-4" />
                结束并保存
              </Button>
            )}

            <Button onClick={() => setShowAdd(!showAdd)} variant="outline" size="sm">
              <Plus className="w-4 h-4" />
              手动添加
            </Button>
            </div>

            {showAdd && (
              <form onSubmit={handleManualAdd} className="p-4 bg-gray-50 border border-gray-100 flex flex-wrap gap-3 items-end">
              <select
                value={manualForm.category}
                onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {Object.entries(TECH_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input
                type="number" min="0" value={manualForm.hours}
                onChange={(e) => setManualForm({ ...manualForm, hours: e.target.value })}
                className="w-20 px-3 py-2 border rounded-lg text-sm"
                placeholder="时"
              />
              <span className="text-gray-400">:</span>
              <input
                type="number" min="0" max="59" value={manualForm.minutes}
                onChange={(e) => setManualForm({ ...manualForm, minutes: e.target.value })}
                className="w-20 px-3 py-2 border rounded-lg text-sm"
                placeholder="分"
              />
              <input
                value={manualForm.note}
                onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg text-sm"
                placeholder="备注（可选）"
              />
              <Button type="submit" size="sm">保存</Button>
            </form>
            )}
          </div>
        </GznuPanel>
      </div>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GznuPanel>
            <GznuSectionHead title="各方向学习时长（分钟）" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} 分钟`, "学习时长"]} />
                  <Bar dataKey="duration" fill="#1565c0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GznuPanel>

          <GznuPanel>
            <GznuSectionHead title="学习进度分布" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatDuration(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GznuPanel>
        </div>
      )}

      <GznuPanel>
        <GznuSectionHead title="最近学习记录" />
        {recentSessions.length === 0 ? (
          <EmptyState title="暂无学习记录" description="开始你的第一次学习吧！" icon={Clock} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">日期</th>
                  <th className="py-3 pr-4">技术方向</th>
                  <th className="py-3 pr-4">时长</th>
                  <th className="py-3">备注</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{new Date(s.date).toLocaleDateString("zh-CN")}</td>
                    <td className="py-3 pr-4">
                      {getCategoryMeta(s.category).label || s.category}
                    </td>
                    <td className="py-3 pr-4 font-medium">{formatDuration(s.duration)}</td>
                    <td className="py-3 text-gray-500">{s.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GznuPanel>
    </div>
  );
}
