"use client";

import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useHotkey } from "@/hooks/useHotkey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { VideoSourceField } from "@/components/VideoSourceField";
import { TECH_CATEGORIES, EXAM_CATEGORIES, RESOURCE_TYPES, RESOURCE_ZONES, type ResourceZoneKey, type ResourceTypeKey } from "@/lib/utils";

export function ResourceUploadModal({
  userId,
  defaultZone = "competition",
  onClose,
  onSuccess,
}: {
  userId: string;
  defaultZone?: ResourceZoneKey;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const zoneConfig = RESOURCE_ZONES[defaultZone];
  const defaultType = zoneConfig.types[0];
  const categoryOptions = defaultZone === "exam" ? EXAM_CATEGORIES : TECH_CATEGORIES;
  const defaultCategory = defaultZone === "exam" ? "FINAL_EXAM" : "EMBEDDED";
  const zoneTypes = zoneConfig.types;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{
    title: string;
    description: string;
    type: ResourceTypeKey;
    category: string;
    videoUrl: string;
    competition: string;
    year: string;
  }>({
    title: "",
    description: "",
    type: defaultType,
    category: defaultCategory,
    videoUrl: "",
    competition: "",
    year: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useHotkey("Escape", onClose, { enabled: !loading });
  useFocusTrap(true, modalRef);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      (form.type === "VIDEO" || form.type === "COURSE_VIDEO") &&
      !form.videoUrl.trim() &&
      !videoFile
    ) {
      setError("请填写视频链接或上传本地视频");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("type", form.type);
    formData.append("category", form.category);
    if (form.videoUrl) formData.append("videoUrl", form.videoUrl);
    if (form.competition) formData.append("competition", form.competition);
    if (form.year) formData.append("year", form.year);
    if (file) formData.append("file", file);
    if (videoFile) formData.append("videoFile", videoFile);
    try {
      const res = await fetch("/api/resources", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={loading ? undefined : onClose}
    >
      <div ref={modalRef} className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Upload className="w-5 h-5" />
            上传资源
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">标题 *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus-visible:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus-visible:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">类型 *</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value as ResourceTypeKey;
                  if (type !== "TEMPLATE") setFile(null);
                  if (type !== "VIDEO" && type !== "COURSE_VIDEO") {
                    setVideoFile(null);
                    setForm({ ...form, type, videoUrl: "" });
                  } else {
                    setForm({ ...form, type });
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {zoneTypes.map((key) => (
                  <option key={key} value={key}>{RESOURCE_TYPES[key].label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">{zoneConfig.subtitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {defaultZone === "exam" ? "备考方向 *" : "学习方向 *"}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {Object.entries(categoryOptions).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {form.type === "VIDEO" || form.type === "COURSE_VIDEO" ? (
            <VideoSourceField
              videoUrl={form.videoUrl}
              onVideoUrlChange={(url) => setForm({ ...form, videoUrl: url })}
              videoFile={videoFile}
              onVideoFileChange={setVideoFile}
              disabled={loading}
            />
          ) : null}
          {form.type === "COMPETITION" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">比赛名称</label>
                <input
                  value={form.competition}
                  onChange={(e) => setForm({ ...form, competition: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">年份</label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {form.type === "TEMPLATE" && (
            <div>
              <label className="block text-sm font-medium mb-1">程序文件</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
                accept=".c,.h,.cpp,.py,.js,.ts,.zip,.rar,.txt,.md,.json"
              />
            </div>
          )}

          <p className="text-xs text-gray-400">上传的资源需经管理员审核后才会公开显示</p>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="flex-1">
              取消
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              提交
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
