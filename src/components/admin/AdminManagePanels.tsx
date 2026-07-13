"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Save, Upload, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import {
  RESOURCE_TYPES,
  RESOURCE_ZONES,
  getCategoriesForZone,
  getCategoryFilterLabel,
  getCategoryMeta,
  getResourceZone,
  cn,
  type ResourceTypeKey,
  type ResourceZoneKey,
} from "@/lib/utils";
import type { CarouselSlideData } from "@/lib/site-content";
import type { ImageProfile } from "@/lib/upload";
import {
  parseGalleryMembers,
  parseWorkHighlights,
  type GalleryMember,
} from "@/lib/gallery-types";
import {
  GRID_SLOTS_PER_ROW,
  buildSlotOptions,
  certToSlot,
  groupCertificatesIntoRows,
  maxCertificateRow,
  slotKey,
  slotLabel,
  type CertificateSlot,
} from "@/lib/certificate-layout";
import { VideoSourceField } from "@/components/VideoSourceField";
import {
  isVideoLikeFile,
  sortVideoFilesByLeadingNumber,
  titleFromVideoFilename,
} from "@/lib/playlist-upload";
import {
  EMPTY_TAXONOMY,
  getCategoryMetaFromTaxonomy,
  getResourceZoneForType,
  getZoneTypes,
  isTemplateResourceType,
  isVideoResourceType,
  mergeCategoriesForZone,
  mergeResourceTypes,
  type ResourceTaxonomy,
} from "@/lib/resource-taxonomy";

async function uploadMedia(file: File, profile: ImageProfile = "content"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("profile", profile);
  const res = await fetch("/api/admin/media", {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "上传失败");
  return data.url as string;
}

function MediaUploadField({
  label,
  value,
  onChange,
  accept = "image/*",
  hint,
  profile = "content",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  hint?: string;
  profile?: ImageProfile;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, profile);
      onChange(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative w-28 h-20 bg-white border overflow-hidden shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">暂无</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              e.target.value = "";
              void handleFile(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? "上传中..." : value ? "更换" : "上传"}
          </Button>
          {value ? (
            <button type="button" className="text-xs text-red-500 text-left" onClick={() => onChange("")}>
              清除
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminCarouselPanel({ initialSlides }: { initialSlides: CarouselSlideData[] }) {
  const router = useRouter();
  const [slides, setSlides] = useState(initialSlides);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const toast = useToast();

  function updateSlide(index: number, patch: Partial<CarouselSlideData>) {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSlide() {
    setSlides((prev) => [
      ...prev,
      { id: `slide-${Date.now()}`, title: "", subtitle: "", imageUrl: "", link: "" },
    ]);
  }

  function removeSlide(index: number) {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveSlides(nextSlides: CarouselSlideData[], message = "轮播图已保存") {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ key: "home_carousel", content: nextSlides }),
      });
      if (!res.ok) throw new Error("保存失败");
      toast.success(message);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleImage(index: number, file: File | null) {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await uploadMedia(file, "hero");
      let nextSlides: CarouselSlideData[] = [];
      setSlides((prev) => {
        nextSlides = prev.map((s, i) => (i === index ? { ...s, imageUrl: url } : s));
        return nextSlides;
      });
      await saveSlides(nextSlides, "图片已上传并保存");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900">首页轮播图</h3>
          <p className="text-xs text-gray-500 mt-1">上传图片后会自动保存；也可修改标题后点「保存轮播」</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={addSlide}><Plus className="w-4 h-4" />添加</Button>
          <Button size="sm" onClick={() => saveSlides(slides)} disabled={saving}>
            <Save className="w-4 h-4" />保存轮播
          </Button>
        </div>
      </div>
      {slides.map((slide, i) => (
        <div key={`${slide.id}-${slide.imageUrl}`} className="p-4 border rounded-lg bg-gray-50 space-y-3">
          <div className="flex gap-4">
            <div className="relative w-40 h-24 bg-white border overflow-hidden shrink-0">
              {slide.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">暂无图片</div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <input placeholder="标题" value={slide.title} onChange={(e) => updateSlide(i, { title: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="副标题" value={slide.subtitle || ""} onChange={(e) => updateSlide(i, { subtitle: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="跳转链接 (/about)" value={slide.link || ""} onChange={(e) => updateSlide(i, { link: e.target.value })} className="px-3 py-2 border rounded-lg text-sm md:col-span-2" />
              <div className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm"
                  disabled={uploadingIndex === i}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    e.target.value = "";
                    void handleImage(i, file);
                  }}
                />
                {uploadingIndex === i ? (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> 正在上传并保存...
                  </p>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={() => removeSlide(i)} className="text-red-500 h-fit"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

type CertItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  position: string;
  order: number;
  row: number;
};

function certItemToSlot(cert: CertItem): CertificateSlot {
  return certToSlot(cert);
}

function slotMapFromItems(items: CertItem[]) {
  const map = new Map<string, CertItem>();
  for (const item of items) {
    map.set(slotKey(certItemToSlot(item)), item);
  }
  return map;
}

function LayoutSlotButton({
  slot,
  cert,
  onClick,
}: {
  slot: CertificateSlot;
  cert: CertItem | null;
  onClick: () => void;
}) {
  const isLeft = slot.position === "left";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-lg border text-left transition-all hover:border-primary/50 hover:shadow-sm ${
        isLeft ? "aspect-[3/4] min-h-[180px]" : "aspect-[4/3]"
      } ${cert ? "border-gray-200 bg-white" : "border-dashed border-gray-300 bg-gray-50"}`}
    >
      {cert?.imageUrl ? (
        <Image src={cert.imageUrl} alt={cert.title} fill className="object-contain p-1.5" sizes="200px" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
          <Plus className="h-5 w-5" />
          <span className="px-2 text-center text-[11px]">{isLeft ? "竖版" : `宫格 ${slot.order + 1}`}</span>
        </div>
      )}
      {cert ? (
        <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          <p className="line-clamp-2">{cert.title}</p>
        </div>
      ) : null}
    </button>
  );
}

export function AdminCertificatesPanel({ items }: { items: CertItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    year: "",
    slotKey: "0-left-0",
    imageUrl: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [extraRows, setExtraRows] = useState(0);
  const toast = useToast();

  const layoutRowCount = Math.max(1, maxCertificateRow(items) + 1 + extraRows);
  const slotOptions = buildSlotOptions(layoutRowCount);
  const occupiedSlots = slotMapFromItems(items);
  const previewRows = groupCertificatesIntoRows(items);

  function openSlot(slot: CertificateSlot, cert: CertItem | null) {
    const key = slotKey(slot);
    if (cert) {
      setEditing(cert.id);
      setAdding(false);
      setForm({
        title: cert.title,
        description: cert.description || "",
        year: cert.year?.toString() || "",
        slotKey: key,
        imageUrl: cert.imageUrl,
      });
    } else {
      setAdding(true);
      setEditing(null);
      setForm({
        title: "",
        description: "",
        year: "",
        slotKey: key,
        imageUrl: "",
      });
    }
    setFile(null);
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setForm({ title: "", description: "", year: "", slotKey: "0-left-0", imageUrl: "" });
    setFile(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const slot = slotKeyToFields(form.slotKey);
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("year", form.year);
    fd.append("row", String(slot.row));
    fd.append("position", slot.position);
    fd.append("order", String(slot.order));
    fd.append("imageUrl", form.imageUrl);
    if (file) fd.append("file", file);

    const url = adding ? "/api/admin/certificates" : `/api/admin/certificates/${editing}`;
    const res = await fetch(url, { method: adding ? "POST" : "PUT", body: fd });
    if (!res.ok) {
      toast.error((await res.json()).error || "操作失败");
      return;
    }
    setEditing(null);
    setAdding(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该证书？")) return;
    await fetch(`/api/admin/certificates/${id}`, { method: "DELETE" });
    setEditing(null);
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          每排布局为左侧 1 张竖版 + 右侧 6 张横版宫格。点击空位添加，点击已有证书编辑。
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setExtraRows((n) => n + 1)}>
            <Plus className="w-4 h-4" />添加下一排
          </Button>
          <Button size="sm" onClick={startAdd}><Plus className="w-4 h-4" />添加证书</Button>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-4">
        <h4 className="text-sm font-semibold text-gray-800">首页布局预览</h4>
        {Array.from({ length: layoutRowCount }, (_, row) => row).map((row) => {
          const leftSlot: CertificateSlot = { row, position: "left", order: 0 };
          const gridSlots = Array.from({ length: GRID_SLOTS_PER_ROW }, (_, order) => ({
            row,
            position: "grid" as const,
            order,
          }));

          return (
            <div key={row} className="rounded-lg border border-gray-100 bg-[#f8fafc] p-3">
              <p className="mb-3 text-xs font-medium text-gray-500">第 {row + 1} 排</p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <LayoutSlotButton
                    slot={leftSlot}
                    cert={occupiedSlots.get(slotKey(leftSlot)) ?? null}
                    onClick={() => openSlot(leftSlot, occupiedSlots.get(slotKey(leftSlot)) ?? null)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:col-span-9">
                  {gridSlots.map((slot) => (
                    <LayoutSlotButton
                      key={slotKey(slot)}
                      slot={slot}
                      cert={occupiedSlots.get(slotKey(slot)) ?? null}
                      onClick={() => openSlot(slot, occupiedSlots.get(slotKey(slot)) ?? null)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {previewRows.length === 0 ? (
          <p className="text-sm text-gray-400">尚未配置证书，请先点击上方空位或“添加证书”。</p>
        ) : null}
      </div>

      {(adding || editing) && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border bg-blue-50/50 p-4">
          <select
            value={form.slotKey}
            onChange={(e) => setForm({ ...form, slotKey: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            {slotOptions.map((slot) => (
              <option key={slotKey(slot)} value={slotKey(slot)}>
                {slotLabel(slot)}
                {occupiedSlots.has(slotKey(slot)) && occupiedSlots.get(slotKey(slot))?.id !== editing
                  ? "（已占用）"
                  : ""}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="证书标题"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="年份"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <div className="flex gap-2">
            <Button type="submit" size="sm">保存</Button>
            {editing ? (
              <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(editing)}>
                删除
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(null); }}>
              取消
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm">
            <div className="relative h-12 w-16 shrink-0 overflow-hidden border bg-white">
              {c.imageUrl ? <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="64px" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <span className="mr-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                {slotLabel(certItemToSlot(c))}
              </span>
              {c.year ? <span className="mr-2 text-primary">{c.year}年</span> : null}
              <span className="font-medium">{c.title}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => openSlot(certItemToSlot(c), c)}>编辑</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function slotKeyToFields(key: string): CertificateSlot {
  const [row, position, order] = key.split("-");
  return {
    row: Number(row),
    position: position === "left" ? "left" : "grid",
    order: Number(order),
  };
}

type GalleryItemRow = {
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
};

type WorkFormState = {
  title: string;
  description: string;
  type: string;
  year: string;
  order: string;
  teamName: string;
  imageUrl: string;
  teamPhotoUrl: string;
  demoVideo: string;
  momentImages: (string | null)[];
  members: GalleryMember[];
};

const EMPTY_WORK_FORM: WorkFormState = {
  title: "",
  description: "",
  type: "work",
  year: "2026",
  order: "0",
  teamName: "",
  imageUrl: "",
  teamPhotoUrl: "",
  demoVideo: "",
  momentImages: Array(6).fill(null),
  members: [],
};

function workFormFromItem(g: GalleryItemRow): WorkFormState {
  const highlights = parseWorkHighlights(g.highlightsJson);
  return {
    title: g.title,
    description: g.description || "",
    type: g.type,
    year: g.year?.toString() || "",
    order: String(g.order),
    teamName: g.teamName || "",
    imageUrl: g.imageUrl,
    teamPhotoUrl: g.teamPhotoUrl || "",
    demoVideo: highlights.demoVideo || "",
    momentImages: highlights.momentImages,
    members: parseGalleryMembers(g.membersJson),
  };
}

export function AdminGalleryPanel({ items }: { items: GalleryItemRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<WorkFormState>(EMPTY_WORK_FORM);
  const toast = useToast();

  function startEdit(g: GalleryItemRow) {
    setEditing(g.id);
    setAdding(false);
    setForm(g.type === "work" ? workFormFromItem(g) : {
      ...EMPTY_WORK_FORM,
      title: g.title,
      description: g.description || "",
      type: g.type,
      year: g.year?.toString() || "",
      order: String(g.order),
      imageUrl: g.imageUrl,
    });
  }

  function updateMember(index: number, patch: Partial<GalleryMember>) {
    setForm((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("type", form.type);
    fd.append("year", form.year);
    fd.append("order", form.order);
    fd.append("imageUrl", form.imageUrl);
    if (form.type === "work") {
      fd.append("teamName", form.teamName);
      fd.append("teamPhotoUrl", form.teamPhotoUrl);
      fd.append(
        "highlightsJson",
        JSON.stringify({
          demoVideo: form.demoVideo || null,
          momentImages: form.momentImages.map((url) =>
            url && !url.includes("placeholder") ? url : null
          ),
        })
      );
      fd.append("membersJson", JSON.stringify(form.members));
    }

    const url = adding ? "/api/admin/gallery" : `/api/admin/gallery/${editing}`;
    const res = await fetch(url, { method: adding ? "POST" : "PUT", body: fd, credentials: "same-origin" });
    if (!res.ok) {
      toast.error((await res.json()).error || "操作失败");
      return;
    }
    setEditing(null);
    setAdding(false);
    toast.success("保存成功，前台作品展示页已更新");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除？")) return;
    await fetch(`/api/admin/gallery/${id}`, { method: "DELETE", credentials: "same-origin" });
    router.refresh();
  }

  const isWork = form.type === "work";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">管理竞赛作品封面、合照、演示视频与赛场瞬间</p>
        <Button size="sm" onClick={() => { setAdding(true); setEditing(null); setForm(EMPTY_WORK_FORM); }}>
          <Plus className="w-4 h-4" />添加作品
        </Button>
      </div>
      {(adding || editing) && (
        <form onSubmit={submit} className="p-4 border rounded-lg bg-blue-50/50 space-y-4">
          <input required placeholder="作品名称" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <textarea placeholder="简介" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="work">竞赛作品</option>
              <option value="member">成员风采</option>
            </select>
            <input placeholder="年份" value={form.year} onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            {isWork ? (
              <input placeholder="队伍名称" value={form.teamName} onChange={(e) => setForm((prev) => ({ ...prev, teamName: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            ) : (
              <div />
            )}
            <input placeholder="排序" value={form.order} onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          </div>

          <MediaUploadField
            label="作品封面图片"
            value={form.imageUrl}
            onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
            hint="展示在作品列表与详情页顶部"
          />

          {isWork && (
            <>
              <MediaUploadField
                label="队伍合照"
                value={form.teamPhotoUrl}
                onChange={(url) => setForm((prev) => ({ ...prev, teamPhotoUrl: url }))}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">作品运行演示</label>
                <input
                  placeholder="B站链接（如 https://www.bilibili.com/video/BVxxx）或已上传视频地址"
                  value={form.demoVideo}
                  onChange={(e) => setForm((prev) => ({ ...prev, demoVideo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <MediaUploadField
                  label="或上传演示视频"
                  value={form.demoVideo.startsWith("/uploads/videos/") ? form.demoVideo : ""}
                  onChange={(url) => setForm((prev) => ({ ...prev, demoVideo: url }))}
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  hint="支持 mp4 / webm / mov"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">赛场精彩瞬间（6 张）</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.momentImages.map((url, idx) => (
                    <MediaUploadField
                      key={idx}
                      label={`瞬间 ${idx + 1}`}
                      value={url || ""}
                      onChange={(next) => {
                        setForm((prev) => {
                          const momentImages = [...prev.momentImages];
                          momentImages[idx] = next || null;
                          return { ...prev, momentImages };
                        });
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">队员风采</label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setForm((prev) => ({ ...prev, members: [...prev.members, { name: "", role: "" }] }))}
                  >
                    <Plus className="w-4 h-4" />添加队员
                  </Button>
                </div>
                {form.members.map((member, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-white space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input placeholder="姓名" value={member.name} onChange={(e) => updateMember(idx, { name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                      <input placeholder="角色" value={member.role || ""} onChange={(e) => updateMember(idx, { role: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <MediaUploadField
                      label="队员照片"
                      value={member.photoUrl || ""}
                      onChange={(photoUrl) => updateMember(idx, { photoUrl })}
                      profile="thumb"
                    />
                    <button type="button" className="text-xs text-red-500" onClick={() => setForm((prev) => ({ ...prev, members: prev.members.filter((_, i) => i !== idx) }))}>
                      删除队员
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm">保存</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setAdding(false); setEditing(null); }}>取消</Button>
          </div>
        </form>
      )}
      <div className="space-y-2">
        {items.map((g) => (
          <div key={g.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm">
            <div className="relative w-16 h-12 bg-white border overflow-hidden shrink-0">
              {g.imageUrl ? <Image src={g.imageUrl} alt="" fill className="object-cover" sizes="64px" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs px-1.5 py-0.5 rounded mr-2 ${g.type === "work" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                {g.type === "work" ? "作品" : "成员"}
              </span>
              {g.year ? <span className="text-primary mr-2">{g.year}年</span> : null}
              {g.title}
            </div>
            <Button size="sm" variant="outline" onClick={() => startEdit(g)}>编辑</Button>
            <button type="button" onClick={() => handleDelete(g.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

type ResourceRow = {
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
};

function defaultFormForZone(zone: ResourceZoneKey) {
  const zoneConfig = RESOURCE_ZONES[zone];
  const type = zoneConfig.types[0];
  const category = zone === "exam" ? "FINAL_EXAM" : "EMBEDDED";
  return {
    title: "",
    description: "",
    type,
    category,
    videoUrl: "",
    coverUrl: "",
    status: "APPROVED",
    isPlaylist: false,
    playlistItems: [],
  };
}

function itemsInZone(items: ResourceRow[], zone: ResourceZoneKey, taxonomy: ResourceTaxonomy) {
  const types = new Set(getZoneTypes(zone, taxonomy));
  return items.filter((item) => types.has(item.type) || getResourceZoneForType(item.type, taxonomy) === zone);
}

function TaxonomyInlineAdd({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (label: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSubmit() {
    const trimmed = label.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onAdd(trimmed);
      setLabel("");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "添加失败");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="text-xs text-primary hover:underline" onClick={() => setOpen(true)}>
        + 新增
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={placeholder}
        className="min-w-[8rem] flex-1 rounded border px-2 py-1 text-xs"
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void handleSubmit();
          }
        }}
      />
      <Button type="button" size="sm" disabled={loading || !label.trim()} onClick={() => void handleSubmit()}>
        {loading ? "..." : "确定"}
      </Button>
      <button
        type="button"
        className="text-xs text-gray-400 hover:text-gray-600"
        onClick={() => {
          setOpen(false);
          setLabel("");
        }}
      >
        取消
      </button>
    </div>
  );
}

type PlaylistItem = {
  id: string;
  title: string;
  videoUrl: string;
};

type ResourceFormState = {
  title: string;
  description: string;
  type: string;
  category: string;
  videoUrl: string;
  coverUrl: string;
  status: string;
  isPlaylist: boolean;
  playlistItems: PlaylistItem[];
};

export function AdminResourcesPanel({ items }: { items: ResourceRow[] }) {
  const router = useRouter();
  const [zone, setZone] = useState<ResourceZoneKey>("competition");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<ResourceFormState>(defaultFormForZone("competition"));
  const [file, setFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [playlistBatchUploading, setPlaylistBatchUploading] = useState(false);
  const [playlistBatchStatus, setPlaylistBatchStatus] = useState("");
  const playlistBatchInputRef = useRef<HTMLInputElement>(null);
  const [taxonomy, setTaxonomy] = useState<ResourceTaxonomy>(EMPTY_TAXONOMY);
  const toast = useToast();

  const mergedTypes = useMemo(() => mergeResourceTypes(taxonomy), [taxonomy]);
  const zoneTypes = useMemo(() => getZoneTypes(zone, taxonomy), [zone, taxonomy]);
  const zoneCategories = useMemo(() => mergeCategoriesForZone(zone, taxonomy), [zone, taxonomy]);
  const zoneConfig = RESOURCE_ZONES[zone];
  const categoryFilterLabel = getCategoryFilterLabel(zone);
  const competitionItems = useMemo(() => itemsInZone(items, "competition", taxonomy), [items, taxonomy]);
  const examItems = useMemo(() => itemsInZone(items, "exam", taxonomy), [items, taxonomy]);
  const zoneItems = zone === "competition" ? competitionItems : examItems;
  const formIsVideo = isVideoResourceType(form.type, taxonomy);
  const formIsTemplate = isTemplateResourceType(form.type, taxonomy);

  useEffect(() => {
    fetch("/api/resource-taxonomy")
      .then((res) => res.json())
      .then((data) => {
        if (data?.taxonomy) setTaxonomy(data.taxonomy);
      })
      .catch(() => {});
  }, []);

  async function addCustomType(label: string) {
    const res = await fetch("/api/admin/resource-taxonomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "type", label, zone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "添加失败");
    setTaxonomy((prev) => ({ ...prev, customTypes: [...prev.customTypes, data] }));
    setForm((prev) => ({ ...prev, type: data.key }));
  }

  async function addCustomCategory(label: string) {
    const res = await fetch("/api/admin/resource-taxonomy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "category", label, zone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "添加失败");
    setTaxonomy((prev) => ({ ...prev, customCategories: [...prev.customCategories, data] }));
    setForm((prev) => ({ ...prev, category: data.key }));
  }

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return zoneItems.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [zoneItems, query, typeFilter, categoryFilter]);

  function switchZone(nextZone: ResourceZoneKey) {
    setZone(nextZone);
    setTypeFilter("");
    setCategoryFilter("");
    setQuery("");
    setAdding(false);
    setEditing(null);
    setForm(defaultFormForZone(nextZone));
    setFile(null);
    setVideoFile(null);
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setForm(defaultFormForZone(zone));
    setFile(null);
    setVideoFile(null);
    setPlaylistBatchStatus("");
  }

  async function handlePlaylistBatchFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const videos = Array.from(fileList).filter(isVideoLikeFile);
    if (videos.length === 0) {
      toast.warning("请选择视频文件（mp4 / webm / mov 等）");
      return;
    }
    if (videos.length !== fileList.length) {
      toast.info(`已忽略 ${fileList.length - videos.length} 个非视频文件`);
    }

    const sorted = sortVideoFilesByLeadingNumber(videos);
    setPlaylistBatchUploading(true);

    try {
      const newItems: PlaylistItem[] = [];
      for (let i = 0; i < sorted.length; i++) {
        const file = sorted[i];
        setPlaylistBatchStatus(`正在上传 ${i + 1}/${sorted.length}：${file.name}`);
        const url = await uploadMedia(file);
        newItems.push({
          id: `item-${Date.now()}-${i}`,
          title: titleFromVideoFilename(file.name),
          videoUrl: url,
        });
      }

      setForm((prev) => ({
        ...prev,
        playlistItems: [...prev.playlistItems, ...newItems],
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "批量上传失败");
    } finally {
      setPlaylistBatchUploading(false);
      setPlaylistBatchStatus("");
      if (playlistBatchInputRef.current) playlistBatchInputRef.current.value = "";
    }
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (form.isPlaylist) {
      if (form.playlistItems.length === 0) {
        toast.warning("选集模式至少需要添加一个视频");
        return;
      }
      if (form.playlistItems.some((item) => !item.videoUrl.trim())) {
        toast.warning("选集内每个视频都需要填写链接或上传文件");
        return;
      }
    } else if (isVideoResourceType(form.type, taxonomy) && !form.videoUrl.trim() && !videoFile) {
      toast.warning("请填写视频链接或上传本地视频");
      return;
    }
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("type", form.type);
    fd.append("category", form.category);
    fd.append("status", form.status);
    fd.append("isPlaylist", String(form.isPlaylist));
    fd.append("playlistItems", JSON.stringify(form.playlistItems));
    if (!form.isPlaylist && form.videoUrl) {
      fd.append("videoUrl", form.videoUrl);
    }
    if (file) fd.append("file", file);
    if (videoFile) fd.append("videoFile", videoFile);
    if (form.coverUrl) fd.append("coverUrl", form.coverUrl);
    const res = await fetch("/api/resources", { method: "POST", body: fd });
    if (!res.ok) {
      toast.error((await res.json()).error || "上传失败");
      return;
    }
    setAdding(false);
    router.refresh();
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (form.isPlaylist) {
      if (form.playlistItems.length === 0) {
        toast.warning("选集模式至少需要添加一个视频");
        return;
      }
      if (form.playlistItems.some((item) => !item.videoUrl.trim())) {
        toast.warning("选集内每个视频都需要填写链接或上传文件");
        return;
      }
    } else if (isVideoResourceType(form.type, taxonomy) && !form.videoUrl.trim() && !videoFile) {
      toast.warning("请填写视频链接或上传本地视频");
      return;
    }
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("type", form.type);
    fd.append("category", form.category);
    fd.append("status", form.status);
    fd.append("isPlaylist", String(form.isPlaylist));
    fd.append("playlistItems", JSON.stringify(form.playlistItems));
    if (!form.isPlaylist && form.videoUrl) {
      fd.append("videoUrl", form.videoUrl);
    }
    if (file) fd.append("file", file);
    if (videoFile) fd.append("videoFile", videoFile);
    fd.append("coverUrl", form.coverUrl);
    const res = await fetch(`/api/admin/resources/${editing}`, { method: "PATCH", body: fd });
    if (!res.ok) {
      toast.error((await res.json()).error || "更新失败");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该资源？")) return;
    await fetch(`/api/admin/resources/${id}`, { method: "DELETE" });
    setEditing(null);
    router.refresh();
  }

  function startEdit(r: ResourceRow) {
    const itemZone = getResourceZoneForType(r.type, taxonomy);
    setZone(itemZone);
    setEditing(r.id);
    setAdding(false);
    let parsedPlaylistItems: PlaylistItem[] = [];
    if (r.playlistItems) {
      try {
        parsedPlaylistItems = JSON.parse(r.playlistItems);
      } catch {
        parsedPlaylistItems = [];
      }
    }
    setForm({
      title: r.title,
      description: r.description || "",
      type: r.type as ResourceTypeKey,
      category: r.category,
      videoUrl: r.videoUrl || "",
      coverUrl: r.coverUrl || "",
      status: r.status,
      isPlaylist: r.isPlaylist,
      playlistItems: parsedPlaylistItems,
    });
    setFile(null);
    setVideoFile(null);
  }

  const hasActiveFilters = !!(query.trim() || typeFilter || categoryFilter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(Object.keys(RESOURCE_ZONES) as ResourceZoneKey[]).map((zoneKey) => {
          const config = RESOURCE_ZONES[zoneKey];
          const count = zoneKey === "competition" ? competitionItems.length : examItems.length;
          const active = zone === zoneKey;
          return (
            <button
              key={zoneKey}
              type="button"
              onClick={() => switchZone(zoneKey)}
              className={cn(
                "rounded-lg border p-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-gray-200 bg-white hover:border-primary/30"
              )}
            >
              <p className="font-semibold text-gray-900">{config.label}</p>
              <p className="mt-1 text-xs text-gray-500">{config.subtitle}</p>
              <p className="mt-2 text-sm text-primary">{count} 项资源</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          管理{zoneConfig.label}内的资源，支持搜索与筛选
        </p>
        <Button size="sm" onClick={startAdd}>
          <Plus className="w-4 h-4" />
          上传资源
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`在${zoneConfig.label}内搜索标题或描述...`}
              className="w-full rounded-lg border px-10 py-2 text-sm focus:border-primary focus-visible:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="清除搜索"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {hasActiveFilters ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setTypeFilter("");
                setCategoryFilter("");
              }}
            >
              <X className="w-4 h-4" />
              清除筛选
            </Button>
          ) : null}
        </div>

        {zoneTypes.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-400 self-center">资源类型</span>
            <FilterChip active={!typeFilter} label="全部" onClick={() => setTypeFilter("")} />
            {zoneTypes.map((typeKey) => (
              <FilterChip
                key={typeKey}
                active={typeFilter === typeKey}
                label={mergedTypes[typeKey]?.label || typeKey}
                onClick={() => setTypeFilter(typeFilter === typeKey ? "" : typeKey)}
              />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-400 self-center">{categoryFilterLabel}</span>
          <FilterChip active={!categoryFilter} label="全部" onClick={() => setCategoryFilter("")} />
          {Object.entries(zoneCategories).map(([key, cat]) => (
            <FilterChip
              key={key}
              active={categoryFilter === key}
              label={cat.label}
              onClick={() => setCategoryFilter(categoryFilter === key ? "" : key)}
            />
          ))}
        </div>
      </div>

      {(adding || editing) && (
        <form onSubmit={adding ? submitNew : submitEdit} className="space-y-3 rounded-lg border bg-blue-50/50 p-4">
          <p className="text-sm font-medium text-gray-700">
            {adding ? `上传到${zoneConfig.label}` : "编辑资源"}
          </p>
          <input
            required
            placeholder="标题"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="描述"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <MediaUploadField
            label="封面图"
            value={form.coverUrl}
            onChange={(url) => setForm({ ...form, coverUrl: url })}
            profile="thumb"
            hint="建议 16:9 横图，用于学习资源库卡片展示"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">资源类型</span>
                <TaxonomyInlineAdd placeholder="新资源类型" onAdd={addCustomType} />
              </div>
              <select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value;
                  if (!isTemplateResourceType(type, taxonomy)) setFile(null);
                  if (!isVideoResourceType(type, taxonomy)) {
                    setVideoFile(null);
                    setForm({ ...form, type, videoUrl: "" });
                  } else {
                    setForm({ ...form, type });
                  }
                }}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {zoneTypes.map((key) => (
                  <option key={key} value={key}>
                    {mergedTypes[key]?.label || key}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500">{categoryFilterLabel}</span>
                <TaxonomyInlineAdd
                  placeholder={zone === "exam" ? "新备考方向" : "新学习方向"}
                  onAdd={addCustomCategory}
                />
              </div>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {Object.entries(zoneCategories).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {formIsVideo && (
            <div className="space-y-3 border rounded-lg p-3 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPlaylist"
                  checked={form.isPlaylist}
                  onChange={(e) => setForm({ ...form, isPlaylist: e.target.checked, playlistItems: e.target.checked ? form.playlistItems : [] })}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isPlaylist" className="text-sm font-medium text-gray-700">
                  开启选集模式（批量上传多个视频）
                </label>
              </div>

              {form.isPlaylist ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                    <p className="mb-2 text-sm font-medium text-gray-800">批量选择本地视频</p>
                    <p className="mb-3 text-xs leading-relaxed text-gray-500">
                      一次选择多个视频文件，将按文件名开头编号自动排序并填入各集。
                      例如：<span className="font-mono text-gray-600">001_翁恺C语言.mp4</span>、
                      <span className="font-mono text-gray-600">002_翁恺C语言.mp4</span> 会依次成为第 1、2 集。
                    </p>
                    <input
                      ref={playlistBatchInputRef}
                      type="file"
                      accept="video/*,.mp4,.webm,.mov,.m4v,.mkv"
                      multiple
                      className="hidden"
                      disabled={playlistBatchUploading}
                      onChange={(e) => void handlePlaylistBatchFiles(e.target.files)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={playlistBatchUploading}
                      onClick={() => playlistBatchInputRef.current?.click()}
                    >
                      {playlistBatchUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {playlistBatchStatus || "上传中..."}
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          批量选择视频文件
                        </>
                      )}
                    </Button>
                  </div>

                  {form.playlistItems.length > 0 ? (
                    <p className="text-xs text-gray-500">
                      已添加 {form.playlistItems.length} 集，可继续批量选择或手动调整
                    </p>
                  ) : null}

                  {form.playlistItems.map((item, idx) => (
                    <div key={item.id} className="space-y-2 rounded-lg border bg-gray-50 p-3">
                      <div className="flex items-start gap-2">
                        <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1 space-y-2">
                          <input
                            placeholder={`第 ${idx + 1} 集标题`}
                            value={item.title}
                            onChange={(e) => {
                              const newItems = [...form.playlistItems];
                              newItems[idx] = { ...newItems[idx], title: e.target.value };
                              setForm({ ...form, playlistItems: newItems });
                            }}
                            className="w-full rounded border px-2 py-1.5 text-sm"
                          />
                          <VideoSourceField
                            videoUrl={item.videoUrl}
                            onVideoUrlChange={(url) => {
                              const newItems = [...form.playlistItems];
                              newItems[idx] = { ...newItems[idx], videoUrl: url };
                              setForm({ ...form, playlistItems: newItems });
                            }}
                            videoFile={null}
                            onVideoFileChange={() => {}}
                            onUploadFile={uploadMedia}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = form.playlistItems.filter((_, i) => i !== idx);
                            setForm({ ...form, playlistItems: newItems });
                          }}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newItem: PlaylistItem = {
                        id: `item-${Date.now()}`,
                        title: "",
                        videoUrl: "",
                      };
                      setForm({ ...form, playlistItems: [...form.playlistItems, newItem] });
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
                  >
                    + 添加视频
                  </button>
                </div>
              ) : (
                <VideoSourceField
                  videoUrl={form.videoUrl}
                  onVideoUrlChange={(url) => setForm({ ...form, videoUrl: url })}
                  videoFile={videoFile}
                  onVideoFileChange={setVideoFile}
                  onUploadFile={uploadMedia}
                />
              )}
            </div>
          )}
          {!adding && (
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="APPROVED">已通过</option>
              <option value="PENDING">待审核</option>
              <option value="REJECTED">已拒绝</option>
            </select>
          )}
          {formIsTemplate && (
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm" />
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              {adding ? "上传" : "保存"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                setEditing(null);
              }}
            >
              取消
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <div className="border-b px-4 py-3 text-xs text-gray-500">
          共 {filteredItems.length} 项
          {hasActiveFilters ? "（已筛选）" : ""}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-2">标题</th>
              <th className="px-4 py-2">类型</th>
              <th className="px-4 py-2">{categoryFilterLabel}</th>
              <th className="px-4 py-2">状态</th>
              <th className="px-4 py-2">作者</th>
              <th className="px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  暂无匹配的资源
                </td>
              </tr>
            ) : (
              filteredItems.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{r.title}</td>
                  <td className="px-4 py-2">{mergedTypes[r.type]?.label || r.type}</td>
                  <td className="px-4 py-2">{getCategoryMetaFromTaxonomy(r.category, taxonomy).label}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">{r.author.name}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                        编辑
                      </Button>
                      <button type="button" onClick={() => handleDelete(r.id)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-gray-200 bg-white text-gray-600 hover:border-primary/40"
      )}
    >
      {label}
    </button>
  );
}
