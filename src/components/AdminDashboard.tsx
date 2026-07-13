"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, FileCheck, Download, Globe, Award, Images,
  Trash2, Check, X, Plus, Shield, FileText, Package,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, Badge } from "@/components/ui/Card";
import { useToast } from "@/hooks/useToast";
import { getCategoryMeta, RESOURCE_TYPES, formatFileSize } from "@/lib/utils";
import { PERMISSION_MATRIX } from "@/lib/permissions";
import {
  AdminCarouselPanel,
  AdminCertificatesPanel,
  AdminGalleryPanel,
  AdminResourcesPanel,
} from "@/components/admin/AdminManagePanels";
import { AdminFacultyEditor } from "@/components/admin/AdminFacultyEditor";
import type { CarouselSlideData } from "@/lib/site-content";

type Tab = "users" | "resources" | "resourceManage" | "downloads" | "content" | "certificates" | "gallery" | "permissions" | "invoices";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string | null;
  createdAt: string | Date;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  category: string;
  author: { name: string };
  createdAt: string | Date;
}

interface DownloadLog {
  id: string;
  createdAt: string | Date;
  user: { name: string; username: string };
  resource: { title: string };
}

interface CertificateRow {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  position: string;
  order: number;
  row: number;
}

interface GalleryRow {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  type: string;
  year: number | null;
  order: number;
  teamName: string | null;
  teamPhotoUrl: string | null;
  membersJson: string | null;
  highlightsJson: string | null;
}

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  status: string;
  videoUrl: string | null;
  coverUrl: string | null;
  isPlaylist: boolean;
  playlistItems: string | null;
  author: { name: string };
}

interface InvoiceData {
  id: string;
  fileName: string;
  fileSize: number;
  createdAt: string | Date;
  userId: string;
  user: { id: string; name: string; username: string };
}

export function AdminDashboard({
  users,
  pendingResources,
  allResources,
  downloadLogs,
  certificates,
  galleryItems,
  siteContent,
  carouselSlides,
  invoices: initialInvoices,
}: {
  users: User[];
  pendingResources: Resource[];
  allResources: ResourceRow[];
  downloadLogs: DownloadLog[];
  certificates: CertificateRow[];
  galleryItems: GalleryRow[];
  siteContent: string;
  carouselSlides: CarouselSlideData[];
  invoices: InvoiceData[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const DEFAULT_OVERVIEW_STATS = [
    { label: "学习资源", value: 500, suffix: "+" },
    { label: "荣誉证书", value: 20, suffix: "+" },
    { label: "现有成员", value: 30, suffix: "+" },
    { label: "历届成员", value: 4, suffix: "届" },
    { label: "竞赛作品", value: 10, suffix: "+" },
  ];

  function normalizeOverviewStats(raw: unknown): typeof DEFAULT_OVERVIEW_STATS {
    if (Array.isArray(raw) && raw.length > 0) return raw as typeof DEFAULT_OVERVIEW_STATS;
    // 兼容旧格式（固定对象 → 数组）
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const old = raw as Record<string, number>;
      return [
        { label: "学习资源", value: old.resources ?? 500, suffix: "+" },
        { label: "荣誉证书", value: old.certificates ?? 20, suffix: "+" },
        { label: "现有成员", value: old.alumniMembers ?? 30, suffix: "+" },
        { label: "历届成员", value: 4, suffix: "届" },
        { label: "竞赛作品", value: old.competitionWorks ?? 10, suffix: "+" },
      ];
    }
    return DEFAULT_OVERVIEW_STATS;
  }

  const [contentForm, setContentForm] = useState(() => {
    try {
      const parsed = JSON.parse(siteContent);
      const contactInfo = parsed.contactInfo || {
        address: "",
        email: "",
        phone: "",
        hours: "",
      };
      return {
        overview: parsed.overview || "",
        equipment: parsed.equipment || [],
        research: parsed.research || [],
        competitions: parsed.competitions || [],
        faculty: parsed.faculty || [],
        studentAdmins: parsed.studentAdmins || [],
        contact: parsed.contact || "",
        contactInfo,
        recruitment: parsed.recruitment || { intro: "", requirements: [], applyNote: "" },
        overviewStats: normalizeOverviewStats(parsed.overviewStats),
      };
    } catch {
      return {
        overview: "", equipment: [], research: [], competitions: [], faculty: [], studentAdmins: [], contact: "",
        contactInfo: { address: "", email: "", phone: "", hours: "" },
        recruitment: { intro: "", requirements: [], applyNote: "" },
        overviewStats: DEFAULT_OVERVIEW_STATS,
      };
    }
  });
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "MEMBER" });
  const [showNewUser, setShowNewUser] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const [invoiceList] = useState<InvoiceData[]>(initialInvoices);


  const tabs = [
    { key: "users" as Tab, label: "用户管理", icon: Users, count: users.length },
    { key: "resources" as Tab, label: "资源审核", icon: FileCheck, count: pendingResources.length },
    { key: "resourceManage" as Tab, label: "学习资源", icon: FileCheck, count: allResources.length },
    { key: "downloads" as Tab, label: "下载记录", icon: Download, count: downloadLogs.length },
    { key: "content" as Tab, label: "网站内容", icon: Globe },
    { key: "permissions" as Tab, label: "权限说明", icon: Shield },
    { key: "certificates" as Tab, label: "证书管理", icon: Award, count: certificates.length },
    { key: "gallery" as Tab, label: "相册管理", icon: Images, count: galleryItems.length },
    { key: "invoices" as Tab, label: "发票管理", icon: FileText, count: invoiceList.length },
  ];

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });
    if (res.ok) {
      setShowNewUser(false);
      setNewUser({ username: "", password: "", name: "", role: "MEMBER" });
      router.refresh();
    }
  }

  async function handleDeleteUser(id: string) {
    if (!confirm("确定删除该用户？")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleUpdateUserRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) router.refresh();
    else toast.error((await res.json()).error || "更新失败");
  }

  async function handleApproveResource(id: string, status: string) {
    await fetch(`/api/resources/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function handleSaveContent() {
    const info = contentForm.contactInfo || {};
    const contact = [
      info.address && `地址：${info.address}`,
      info.email && `邮箱：${info.email}`,
      info.phone && `电话：${info.phone}`,
      info.hours && `开放时间：${info.hours}`,
    ].filter(Boolean).join("\n");

    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "lab_intro", content: { ...contentForm, contact } }),
    });
    toast.success("保存成功");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  tab === t.key ? "bg-white/20" : "bg-gray-200"
                }`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "users" && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <CardTitle>用户列表</CardTitle>
            <Button size="sm" onClick={() => setShowNewUser(!showNewUser)}>
              <Plus className="w-4 h-4" />
              添加用户
            </Button>
          </div>

          {showNewUser && (
            <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input required placeholder="用户名" value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input required type="password" placeholder="密码" value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <input required placeholder="姓名" value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm" />
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm">
                <option value="MEMBER">成员</option>
                <option value="ADMIN">管理员</option>
              </select>
              <Button type="submit" size="sm">创建</Button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">用户名</th>
                  <th className="py-3 pr-4">姓名</th>
                  <th className="py-3 pr-4">角色</th>
                  <th className="py-3 pr-4">注册时间</th>
                  <th className="py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{u.username}</td>
                    <td className="py-3 pr-4">{u.name}</td>
                    <td className="py-3 pr-4">
                      {u.username === "admin" ? (
                        <Badge className="bg-red-100 text-red-700">管理员</Badge>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="MEMBER">成员</option>
                          <option value="ADMIN">管理员</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 pr-4">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                    <td className="py-3">
                      {u.username !== "admin" && (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "resources" && (
        <Card>
          <CardTitle>待审核资源 ({pendingResources.length})</CardTitle>
          {pendingResources.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4 text-center py-8">暂无待审核资源</p>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingResources.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{r.title}</h4>
                    <p className="text-sm text-gray-500">
                      {getCategoryMeta(r.category).label} ·
                      {RESOURCE_TYPES[r.type as keyof typeof RESOURCE_TYPES]?.label} ·
                      {r.author.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleApproveResource(r.id, "APPROVED")}>
                      <Check className="w-4 h-4" />通过
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleApproveResource(r.id, "REJECTED")}>
                      <X className="w-4 h-4" />拒绝
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "downloads" && (
        <Card>
          <CardTitle>下载记录（共 {downloadLogs.length} 条）</CardTitle>
          {downloadLogs.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4 text-center py-8">暂无下载记录</p>
          ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-3 pr-4">下载人</th>
                  <th className="py-3 pr-4">下载内容</th>
                  <th className="py-3">下载时间</th>
                </tr>
              </thead>
              <tbody>
                {downloadLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">{log.user.name} ({log.user.username})</td>
                    <td className="py-3 pr-4">{log.resource.title}</td>
                    <td className="py-3">{new Date(log.createdAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>
      )}

      {tab === "permissions" && (
        <Card>
          <CardTitle>用户权限说明</CardTitle>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            系统支持三种角色：游客（无需登录）、实验室成员、管理员。权限在路由中间件与 API 层统一校验。
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {PERMISSION_MATRIX.map((item) => (
              <div key={item.role} className="border border-gray-100 rounded-lg p-5 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">{item.role}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">{item.description}</p>
                <ul className="space-y-2">
                  {item.permissions.map((p) => (
                    <li key={p} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "resourceManage" && (
        <Card>
          <CardTitle>学习资源管理</CardTitle>
          <div className="mt-4">
            <AdminResourcesPanel items={allResources} />
          </div>
        </Card>
      )}

      {tab === "content" && (
        <div className="space-y-6">
          <Card>
            <AdminCarouselPanel initialSlides={carouselSlides} />
          </Card>

          <Card>
            <CardTitle>实验室网站内容</CardTitle>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">首页实验室概览数据</label>
              <div className="space-y-3">
                {(contentForm.overviewStats || []).map((item: { label: string; value: number; suffix: string }, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs text-gray-400 mb-0.5">标签</label>
                      <input
                        type="text"
                        placeholder="如：学习资源"
                        value={item.label}
                        onChange={(e) => {
                          const updated = [...(contentForm.overviewStats || [])];
                          updated[index] = { ...updated[index], label: e.target.value };
                          setContentForm({ ...contentForm, overviewStats: updated });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="w-24 shrink-0">
                      <label className="block text-xs text-gray-400 mb-0.5">数值</label>
                      <input
                        type="number"
                        min={0}
                        value={item.value}
                        onChange={(e) => {
                          const updated = [...(contentForm.overviewStats || [])];
                          updated[index] = { ...updated[index], value: Math.max(0, parseInt(e.target.value, 10) || 0) };
                          setContentForm({ ...contentForm, overviewStats: updated });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="w-20 shrink-0">
                      <label className="block text-xs text-gray-400 mb-0.5">后缀</label>
                      <input
                        type="text"
                        placeholder="+"
                        value={item.suffix}
                        onChange={(e) => {
                          const updated = [...(contentForm.overviewStats || [])];
                          updated[index] = { ...updated[index], suffix: e.target.value };
                          setContentForm({ ...contentForm, overviewStats: updated });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (contentForm.overviewStats || []).filter((_: unknown, i: number) => i !== index);
                        setContentForm({ ...contentForm, overviewStats: updated });
                      }}
                      className="text-red-400 hover:text-red-600 p-1 mt-5 shrink-0 transition-colors"
                      title="删除此项"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = [...(contentForm.overviewStats || []), { label: "", value: 0, suffix: "" }];
                  setContentForm({ ...contentForm, overviewStats: updated });
                }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加统计项
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">实验室简介</label>
              <textarea
                value={contentForm.overview || ""}
                onChange={(e) => setContentForm({ ...contentForm, overview: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">研究方向（每行一项）</label>
              <textarea
                value={(contentForm.research || []).join("\n")}
                onChange={(e) => setContentForm({ ...contentForm, research: e.target.value.split("\n").filter(Boolean) })}
                rows={5}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">竞赛赛事（每行：名称|级别|年份|描述）</label>
              <textarea
                value={(contentForm.competitions || []).map((c: { name: string; level?: string; period?: string; description?: string }) =>
                  [c.name, c.level || "", c.period || "", c.description || ""].join("|")
                ).join("\n")}
                onChange={(e) => setContentForm({
                  ...contentForm,
                  competitions: e.target.value.split("\n").filter(Boolean).map((line) => {
                    const [name, level, period, description] = line.split("|").map((s) => s.trim());
                    return { name: name || line, level, period, description };
                  }),
                })}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                placeholder="RoboMaster 机器人大赛|国家级|2019-2024|参与机甲对抗赛项"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">设备资源（每行一项）</label>
              <textarea
                value={(contentForm.equipment || []).join("\n")}
                onChange={(e) => setContentForm({ ...contentForm, equipment: e.target.value.split("\n").filter(Boolean) })}
                rows={5}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <AdminFacultyEditor
                faculty={contentForm.faculty || []}
                studentAdmins={contentForm.studentAdmins || []}
                onFacultyChange={(items) => setContentForm({ ...contentForm, faculty: items })}
                onStudentAdminsChange={(items) => setContentForm({ ...contentForm, studentAdmins: items })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">联系地址</label>
                <input
                  value={contentForm.contactInfo?.address || ""}
                  onChange={(e) => setContentForm({
                    ...contentForm,
                    contactInfo: { ...contentForm.contactInfo, address: e.target.value },
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">联系邮箱</label>
                <input
                  type="email"
                  value={contentForm.contactInfo?.email || ""}
                  onChange={(e) => setContentForm({
                    ...contentForm,
                    contactInfo: { ...contentForm.contactInfo, email: e.target.value },
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">联系电话</label>
                <input
                  value={contentForm.contactInfo?.phone || ""}
                  onChange={(e) => setContentForm({
                    ...contentForm,
                    contactInfo: { ...contentForm.contactInfo, phone: e.target.value },
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">开放时间</label>
                <input
                  value={contentForm.contactInfo?.hours || ""}
                  onChange={(e) => setContentForm({
                    ...contentForm,
                    contactInfo: { ...contentForm.contactInfo, hours: e.target.value },
                  })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">成员招新说明</label>
              <textarea
                value={contentForm.recruitment?.intro || ""}
                onChange={(e) => setContentForm({
                  ...contentForm,
                  recruitment: { ...contentForm.recruitment, intro: e.target.value },
                })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">招新要求（每行一项）</label>
              <textarea
                value={(contentForm.recruitment?.requirements || []).join("\n")}
                onChange={(e) => setContentForm({
                  ...contentForm,
                  recruitment: {
                    ...contentForm.recruitment,
                    requirements: e.target.value.split("\n").filter(Boolean),
                  },
                })}
                rows={5}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">申请方式说明</label>
              <textarea
                value={contentForm.recruitment?.applyNote || ""}
                onChange={(e) => setContentForm({
                  ...contentForm,
                  recruitment: { ...contentForm.recruitment, applyNote: e.target.value },
                })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <Button onClick={handleSaveContent}>保存概况内容</Button>
          </div>
        </Card>
        </div>
      )}

      {tab === "certificates" && (
        <Card>
          <CardTitle>证书管理 ({certificates.length})</CardTitle>
          <div className="mt-4">
            <AdminCertificatesPanel items={certificates} />
          </div>
        </Card>
      )}

      {tab === "gallery" && (
        <Card>
          <CardTitle>作品展示管理 ({galleryItems.length})</CardTitle>
          <div className="mt-4">
            <AdminGalleryPanel items={galleryItems} />
          </div>
        </Card>
      )}

      {tab === "invoices" && (
        <Card>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <CardTitle>发票管理（共 {invoiceList.length} 份）</CardTitle>
            <div className="flex gap-2">
              {selectedInvoiceIds.size > 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const ids = Array.from(selectedInvoiceIds).join(",");
                    const a = document.createElement("a");
                    a.href = `/api/admin/invoices/batch-download?userIds=${ids}`;
                    a.download = "";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setSelectedInvoiceIds(new Set());
                  }}
                >
                  <Download className="w-4 h-4" />
                  批量下载 ({selectedInvoiceIds.size})
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = "/api/admin/invoices/pack-all";
                  a.download = "";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                <Package className="w-4 h-4" />
                一键打包全站发票
              </Button>
            </div>
          </div>

          {invoiceList.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">暂无发票记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-3 pr-2 w-10">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoiceIds(new Set(invoiceList.map(i => i.id)));
                          } else {
                            setSelectedInvoiceIds(new Set());
                          }
                        }}
                        checked={selectedInvoiceIds.size === invoiceList.length && invoiceList.length > 0}
                      />
                    </th>
                    <th className="py-3 pr-4">用户名</th>
                    <th className="py-3 pr-4">姓名</th>
                    <th className="py-3 pr-4">文件名</th>
                    <th className="py-3 pr-4">大小</th>
                    <th className="py-3 pr-4">上传日期</th>
                    <th className="py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceList.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.has(inv.id)}
                          onChange={() => {
                            const next = new Set(selectedInvoiceIds);
                            if (next.has(inv.id)) next.delete(inv.id);
                            else next.add(inv.id);
                            setSelectedInvoiceIds(next);
                          }}
                        />
                      </td>
                      <td className="py-3 pr-4 font-medium">{inv.user.username}</td>
                      <td className="py-3 pr-4">{inv.user.name}</td>
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="line-clamp-1 max-w-[240px]">{inv.fileName}</span>
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{formatFileSize(inv.fileSize)}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {new Date(inv.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="py-3">
                        <a
                          href={`/api/admin/invoices/${inv.id}/download`}
                          download
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          <Download className="w-3.5 h-3.5" />
                          下载
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
