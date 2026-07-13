import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { savePublicVideo, isVideoFile } from "@/lib/upload";
import { normalizePlaylistItems } from "@/lib/episode-progress";

export const dynamic = "force-dynamic";
export const maxDuration = 1800;
import {
  getResourceZoneForType,
  isKnownCategory,
  isKnownResourceType,
  isTemplateResourceType,
  isVideoResourceType,
  loadResourceTaxonomy,
} from "@/lib/resource-taxonomy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const taxonomy = await loadResourceTaxonomy();
  const { id } = await params;
  const formData = await req.formData();
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const type = formData.get("type") as string | null;
  const category = formData.get("category") as string | null;
  const videoUrl = formData.get("videoUrl") as string | null;
  const status = formData.get("status") as string | null;
  const file = formData.get("file") as File | null;
  const videoFile = formData.get("videoFile") as File | null;
  const isPlaylist = formData.get("isPlaylist");
  const playlistItems = formData.get("playlistItems") as string | null;
  const coverUrl = formData.get("coverUrl") as string | null;

  const existing = await prisma.resource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (title) data.title = title.trim();
  if (description !== null) data.description = description || null;

  const nextType = type || existing.type;
  if (type) {
    if (!isKnownResourceType(type, taxonomy)) {
      return NextResponse.json({ error: "无效的资源类型" }, { status: 400 });
    }
    data.type = type;
  }

  if (category) {
    const zone = getResourceZoneForType(nextType, taxonomy);
    if (!isKnownCategory(category, zone, taxonomy)) {
      return NextResponse.json({ error: "无效的分类方向" }, { status: 400 });
    }
    data.category = category;
  }

  if (status) data.status = status;

  if (coverUrl !== null) {
    data.coverUrl = coverUrl.trim() || null;
  }

  const isPlaylistMode = isPlaylist === "true";
  if (isPlaylist !== null) {
    data.isPlaylist = isPlaylistMode;
  }

  if (isPlaylistMode && playlistItems) {
    if (!isVideoResourceType(nextType, taxonomy)) {
      return NextResponse.json({ error: "仅视频类型资源可开启选集模式" }, { status: 400 });
    }
    try {
      const parsed = JSON.parse(playlistItems) as { id?: string; title: string; videoUrl: string }[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return NextResponse.json({ error: "选集模式至少需要添加一个视频" }, { status: 400 });
      }
      if (parsed.some((item) => !item.videoUrl?.trim())) {
        return NextResponse.json({ error: "选集内每个视频都需要填写链接或上传文件" }, { status: 400 });
      }
      data.playlistItems = JSON.stringify(normalizePlaylistItems(id, parsed));
    } catch {
      return NextResponse.json({ error: "选集数据格式错误" }, { status: 400 });
    }
  } else if (!isPlaylistMode) {
    if (videoFile && videoFile.size > 0) {
      if (!isVideoFile(videoFile.name)) {
        return NextResponse.json({ error: "不支持的视频格式" }, { status: 400 });
      }
      const saved = await savePublicVideo(videoFile);
      data.videoUrl = saved.url;
    } else if (videoUrl !== null) {
      data.videoUrl = videoUrl.trim() || null;
    }
  }

  const effectiveType = (data.type as string) || existing.type;
  const effectiveIsPlaylist =
    data.isPlaylist !== undefined ? (data.isPlaylist as boolean) : existing.isPlaylist;

  if (
    !effectiveIsPlaylist &&
    isVideoResourceType(effectiveType, taxonomy) &&
    (data.videoUrl === null || data.videoUrl === undefined) &&
    !existing.videoUrl
  ) {
    return NextResponse.json({ error: "请填写视频链接或上传本地视频" }, { status: 400 });
  }

  if (file && file.size > 0 && isTemplateResourceType(effectiveType, taxonomy)) {
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);
    data.filePath = safeName;
    data.fileName = file.name;
    data.fileSize = file.size;
  }

  const resource = await prisma.resource.update({ where: { id }, data });
  return NextResponse.json(resource);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.resource.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
