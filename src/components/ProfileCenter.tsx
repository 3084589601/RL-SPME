"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Clock, Heart, Star, History, BarChart3, User, Play, Square, Plus,
  Settings, FileText, Upload, Trash2, Camera,
} from "lucide-react";
import { TECH_CATEGORIES, RESOURCE_TYPES, formatDuration, getCategoryMeta, getResourceTypeLabel, formatFileSize } from "@/lib/utils";
import {
  type ProfileSession,
  type ProfileViewLog,
  type ProfileProgress,
  buildCategoryStudyStats,
  buildTypeViewStats,
  calcCompletionRate,
} from "@/lib/profile-stats";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuSectionHead } from "@/components/GznuSectionHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";

const COLORS = ["#1565c0", "#42a5f5", "#0d47a1", "#64b5f6", "#1976d2", "#90caf9", "#1e88e5", "#82b1ff"];

type Tab = "stats" | "history" | "liked" | "favorites" | "settings" | "invoices";

interface InvoiceItem {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export function ProfileCenter({
  userName,
  userAvatar,
  sessions,
  viewLogs,
  progressList,
  totalResources,
}: {
  userName: string;
  userAvatar?: string | null;
  sessions: ProfileSession[];
  viewLogs: ProfileViewLog[];
  progressList: ProfileProgress[];
  totalResources: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState<Tab>("stats");
  const [timerActive, setTimerActive] = useState(false);
  const [timerCategory, setTimerCategory] = useState("EMBEDDED");
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [manualForm, setManualForm] = useState({ category: "EMBEDDED", hours: "1", minutes: "0", note: "" });

  // 账号设置
  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [displayAvatar, setDisplayAvatar] = useState<string | null>(null);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 从 prop 同步头像 URL（处理 SSR hydration）
  useEffect(() => {
    if (userAvatar) {
      setDisplayAvatar(userAvatar);
      setAvatarImgError(false);
    }
  }, [userAvatar]);

  // 发票
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoiceUploading, setInvoiceUploading] = useState(false);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const categoryStats = buildCategoryStudyStats(sessions);
  const typeStats = buildTypeViewStats(progressList);
  const totalStudyDuration = categoryStats.reduce((s, c) => s + c.duration, 0);
  const totalViewDuration = progressList.reduce((s, p) => s + p.viewDuration, 0);
  const completion = calcCompletionRate(progressList, totalResources);
  const likedList = progressList.filter((p) => p.liked && p.resource.status === "APPROVED");
  const favoriteList = progressList.filter((p) => p.favorited && p.resource.status === "APPROVED");

  const categoryPie = categoryStats.map((s) => ({
    name: getCategoryMeta(s.category).label || s.category,
    value: s.duration,
  }));

  const typePie = typeStats.map((s) => ({
    name: RESOURCE_TYPES[s.type as keyof typeof RESOURCE_TYPES]?.label || s.type,
    value: s.duration,
  }));

  const pieData = typePie.length > 0 ? typePie : categoryPie;

  const tabs = [
    { key: "stats" as Tab, label: "学习统计", icon: BarChart3 },
    { key: "history" as Tab, label: "观看历史", icon: History, count: viewLogs.length },
    { key: "liked" as Tab, label: "喜欢", icon: Heart, count: likedList.length },
    { key: "favorites" as Tab, label: "收藏", icon: Star, count: favoriteList.length },
    { key: "invoices" as Tab, label: "发票管理", icon: FileText, count: invoices.length },
    { key: "settings" as Tab, label: "账号设置", icon: Settings },
  ];

  function formatTimer(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  function startTimer() {
    setTimerActive(true);
    setTimerStart(Date.now());
    setElapsed(0);
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
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

  // 发票数据加载
  useEffect(() => {
    if (tab === "invoices") {
      fetch("/api/profile/invoices").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setInvoices(data);
      });
    }
  }, [tab]);

  // 头像文件选择
  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  // 头像上传
  async function handleAvatarUpload() {
    if (!avatarFile) return;
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append("file", avatarFile);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const data = await res.json();
    setAvatarLoading(false);
    if (res.ok) {
      toast.success("头像更换成功");
      setAvatarFile(null);
      setAvatarPreview(null);
      setDisplayAvatar(data.avatar);
      setAvatarImgError(false);
      // 触发 session.update() → JWT callback 从 DB 读取最新 avatar → TopBar 自动刷新
      await updateSession();
      router.refresh();
    } else {
      toast.error(data.error || "上传失败");
    }
  }

  // 密码修改
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("新密码长度不能少于6位");
      return;
    }
    setPwLoading(true);
    const res = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (res.ok) {
      toast.success("密码修改成功，下次登录生效");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast.error(data.error || "修改失败");
    }
  }

  // 发票上传
  async function handleInvoiceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("仅支持上传 PDF 文件");
      return;
    }
    setInvoiceUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/invoices", { method: "POST", body: fd });
    const data = await res.json();
    setInvoiceUploading(false);
    if (res.ok) {
      toast.success("发票上传成功");
      setInvoices(prev => [data, ...prev]);
    } else {
      toast.error(data.error || "上传失败");
    }
    // reset input
    if (invoiceInputRef.current) invoiceInputRef.current.value = "";
  }

  // 发票删除
  async function handleInvoiceDelete(id: string) {
    if (!confirm("确定删除该发票？")) return;
    const res = await fetch(`/api/profile/invoices/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("发票已删除");
      setInvoices(prev => prev.filter(i => i.id !== id));
    } else {
      const data = await res.json();
      toast.error(data.error || "删除失败");
    }
  }

  return (
    <div className="space-y-4">
      <GznuPanel className="p-5 flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 shrink-0">
          {displayAvatar && !avatarImgError ? (
            <img
              src={displayAvatar}
              alt={userName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/15"
              onError={() => setAvatarImgError(true)}
            />
          ) : (
            <div className="w-14 h-14 bg-primary/10 flex items-center justify-center rounded-full">
              <User className="w-7 h-7 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">实验室成员 · 个人学习中心</p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-gray-500">累计学习</p>
            <p className="font-bold text-primary text-lg">{formatDuration(totalStudyDuration)}</p>
          </div>
          <div>
            <p className="text-gray-500">观看时长</p>
            <p className="font-bold text-primary text-lg">{formatDuration(totalViewDuration)}</p>
          </div>
          <div>
            <p className="text-gray-500">学习完成度</p>
            <p className="font-bold text-primary text-lg">{completion.rate}%</p>
          </div>
        </div>
      </GznuPanel>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-100 hover:border-primary/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  tab === t.key ? "bg-white/20" : "bg-gray-100"
                }`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "stats" && (
        <div className="space-y-4">
          <GznuPanel className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">学习完成度</h3>
              <span className="text-sm text-gray-500">
                已完成 {completion.completed} / {completion.total} 个资源
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${completion.rate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              在资源详情页标记学习进度，达到 100% 即计为完成
            </p>
          </GznuPanel>

          <GznuPanel className="overflow-hidden">
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
                <span className="text-3xl font-mono font-bold text-primary">{formatTimer(elapsed)}</span>
                {!timerActive ? (
                  <Button onClick={startTimer} variant="secondary" size="sm">
                    <Play className="w-4 h-4" />开始学习
                  </Button>
                ) : (
                  <Button onClick={stopTimer} variant="danger" size="sm">
                    <Square className="w-4 h-4" />结束并保存
                  </Button>
                )}
                <Button onClick={() => setShowAdd(!showAdd)} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />手动添加
                </Button>
              </div>
              {showAdd && (
                <form onSubmit={handleManualAdd} className="p-4 bg-gray-50 border flex flex-wrap gap-3 items-end">
                  <select
                    value={manualForm.category}
                    onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    {Object.entries(TECH_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <input type="number" min="0" value={manualForm.hours}
                    onChange={(e) => setManualForm({ ...manualForm, hours: e.target.value })}
                    className="w-20 px-3 py-2 border rounded-lg text-sm" placeholder="时" />
                  <span className="text-gray-400">:</span>
                  <input type="number" min="0" max="59" value={manualForm.minutes}
                    onChange={(e) => setManualForm({ ...manualForm, minutes: e.target.value })}
                    className="w-20 px-3 py-2 border rounded-lg text-sm" placeholder="分" />
                  <input value={manualForm.note}
                    onChange={(e) => setManualForm({ ...manualForm, note: e.target.value })}
                    className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg text-sm" placeholder="备注（可选）" />
                  <Button type="submit" size="sm">保存</Button>
                </form>
              )}
            </div>
          </GznuPanel>

          {pieData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GznuPanel>
                <GznuSectionHead title={typePie.length > 0 ? "学习内容时长分布（按类型）" : "学习时长分布（按方向）"} />
                <div className="h-80 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
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

              {categoryPie.length > 0 && typePie.length > 0 && (
                <GznuPanel>
                  <GznuSectionHead title="学习时长分布（按技术方向）" />
                  <div className="h-80 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryPie.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatDuration(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GznuPanel>
              )}
            </div>
          )}

          {pieData.length === 0 && (
            <GznuPanel className="p-10 text-center text-gray-400 text-sm">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              暂无学习数据，浏览资源或使用计时器开始记录吧
            </GznuPanel>
          )}

          {sessions.length > 0 && (
            <GznuPanel>
              <GznuSectionHead title="最近学习记录" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-3 px-5">日期</th>
                      <th className="py-3 pr-4">方向</th>
                      <th className="py-3 pr-4">时长</th>
                      <th className="py-3 pr-4">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 10).map((s) => (
                      <tr key={s.id} className="border-b last:border-0">
                        <td className="py-3 px-5">{new Date(s.date).toLocaleDateString("zh-CN")}</td>
                        <td className="py-3 pr-4">
                          {getCategoryMeta(s.category).label || s.category}
                          {s.resource && (
                            <Link href={`/resources/${s.resource.id}`} className="block text-xs text-primary hover:underline mt-0.5">
                              {s.resource.title}
                            </Link>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-medium">{formatDuration(s.duration)}</td>
                        <td className="py-3 pr-4 text-gray-500">{s.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GznuPanel>
          )}
        </div>
      )}

      {tab === "history" && (
        <GznuPanel>
          <GznuSectionHead title="观看历史" />
          {viewLogs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">暂无观看记录</p>
          ) : (
            <ul>
              {viewLogs.map((log) => (
                <li key={log.id} className="border-b border-gray-50 last:border-0">
                  <Link href={`/resources/${log.resource.id}`} className="gznu-list-item group">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-primary line-clamp-1">{log.resource.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCategoryMeta(log.resource.category).label} · {getResourceTypeLabel(log.resource.type)}
                        {log.duration > 0 && ` · 观看 ${formatDuration(log.duration)}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(log.viewedAt).toLocaleString("zh-CN")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GznuPanel>
      )}

      {tab === "liked" && (
        <ResourceListPanel
          title="喜欢的资源"
          emptyText="还没有喜欢的资源，在资源详情页点击「喜欢」即可添加"
          items={likedList}
          icon={Heart}
        />
      )}

      {tab === "favorites" && (
        <ResourceListPanel
          title="收藏的资源"
          emptyText="还没有收藏的资源，在资源详情页点击「收藏」即可添加"
          items={favoriteList}
          icon={Star}
        />
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          {/* 修改密码 */}
          <GznuPanel className="p-5">
            <GznuSectionHead title="修改密码" />
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原密码</label>
                <input
                  type="password"
                  required
                  value={pwForm.oldPassword}
                  onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="请输入原密码"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                <input
                  type="password"
                  required
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="至少6位"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                <input
                  type="password"
                  required
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                  placeholder="再次输入新密码"
                />
              </div>
              <Button type="submit" loading={pwLoading}>保存密码</Button>
            </form>
          </GznuPanel>

          {/* 更换头像 */}
          <GznuPanel className="p-5">
            <GznuSectionHead title="更换头像" />
            <div className="mt-4 flex items-center gap-6">
              <div className="shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="预览" className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                ) : displayAvatar && !avatarImgError ? (
                  <img
                    src={displayAvatar}
                    alt="当前头像"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    onError={() => setAvatarImgError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-gray-200">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>
                  <Camera className="w-4 h-4" />
                  选择图片
                </Button>
                {avatarFile && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 truncate max-w-[200px]">{avatarFile.name}</span>
                    <Button size="sm" onClick={handleAvatarUpload} loading={avatarLoading}>
                      <Upload className="w-4 h-4" />
                      上传保存
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-400">支持 JPG、PNG、WebP 格式，推荐正方形图片</p>
              </div>
            </div>
          </GznuPanel>
        </div>
      )}

      {tab === "invoices" && (
        <GznuPanel>
          <div className="flex items-center justify-between p-5 pb-0">
            <GznuSectionHead title="我的发票" />
            <div>
              <input
                ref={invoiceInputRef}
                type="file"
                accept=".pdf"
                onChange={handleInvoiceUpload}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                loading={invoiceUploading}
                onClick={() => invoiceInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                上传 PDF 发票
              </Button>
            </div>
          </div>
          {invoices.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              暂无发票记录，点击上方按钮上传 PDF 发票
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-3 px-5">文件名</th>
                    <th className="py-3 pr-4">大小</th>
                    <th className="py-3 pr-4">上传日期</th>
                    <th className="py-3 pr-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 px-5 font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="line-clamp-1">{inv.fileName}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{formatFileSize(inv.fileSize)}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleInvoiceDelete(inv.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GznuPanel>
      )}
    </div>
  );
}

function ResourceListPanel({
  title,
  emptyText,
  items,
  icon: Icon,
}: {
  title: string;
  emptyText: string;
  items: ProfileProgress[];
  icon: typeof Heart;
}) {
  return (
    <GznuPanel>
      <GznuSectionHead title={title} />
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-12">{emptyText}</p>
      ) : (
        <ul>
          {items.map((p) => (
            <li key={p.id} className="border-b border-gray-50 last:border-0">
              <Link href={`/resources/${p.resource.id}`} className="gznu-list-item group">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-primary line-clamp-1">{p.resource.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getCategoryMeta(p.resource.category).label} · {getResourceTypeLabel(p.resource.type)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge className={p.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                    {p.completed ? "已完成" : `${p.progress}%`}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </GznuPanel>
  );
}
