"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, Link2, Film } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

export function VideoSourceField({
  videoUrl,
  onVideoUrlChange,
  videoFile,
  onVideoFileChange,
  onUploadFile,
  disabled,
}: {
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  /** 若提供，选择文件后立即上传并写入 videoUrl（管理员） */
  onUploadFile?: (file: File) => Promise<string>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const isLocalUrl = videoUrl.startsWith("/uploads/videos/");

  async function handlePick(file: File | null) {
    if (!file) return;
    onVideoFileChange(file);
    if (onUploadFile) {
      setUploading(true);
      try {
        const url = await onUploadFile(file);
        onVideoUrlChange(url);
        onVideoFileChange(null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "视频上传失败");
        onVideoFileChange(null);
      } finally {
        setUploading(false);
      }
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <Film className="h-4 w-4 text-primary" />
        视频来源
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
          <Link2 className="h-3.5 w-3.5" />
          视频链接
        </label>
        <input
          type="url"
          value={isLocalUrl ? "" : videoUrl}
          onChange={(e) => {
            onVideoUrlChange(e.target.value);
            if (e.target.value) onVideoFileChange(null);
          }}
          placeholder="B站 / YouTube / MP4 直链等"
          disabled={disabled || uploading}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:border-primary focus-visible:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        或
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">本地上传视频</label>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            e.target.value = "";
            if (file) {
              onVideoUrlChange("");
              void handlePick(file);
            }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "上传中..." : "选择视频文件"}
          </Button>
          {videoFile && !onUploadFile ? (
            <span className="text-xs text-gray-600">已选择：{videoFile.name}</span>
          ) : null}
          {isLocalUrl ? (
            <span className="text-xs text-green-600">已上传本地视频</span>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs text-gray-400">支持 mp4 / webm / mov，本地上传可自动同步学习进度</p>
        {isLocalUrl ? (
          <p className="mt-1 truncate text-xs text-gray-500">{videoUrl}</p>
        ) : null}
      </div>
    </div>
  );
}
