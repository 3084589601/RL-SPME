import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { savePublicVideo, isVideoFile } from "@/lib/upload";
import { Role } from "@prisma/client";
import { normalizePlaylistItems } from "@/lib/episode-progress";
import {
  getResourceZoneForType,
  isKnownCategory,
  isKnownResourceType,
  isTemplateResourceType,
  isVideoResourceType,
  loadResourceTaxonomy,
} from "@/lib/resource-taxonomy";

export const dynamic = "force-dynamic";
export const maxDuration = 1800; // 30 分钟超时，支持 3G 视频上传

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const taxonomy = await loadResourceTaxonomy();
  const formData = await req.formData();
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const type = formData.get("type") as string;
  const category = formData.get("category") as string;
  const videoUrlInput = (formData.get("videoUrl") as string) || "";
  const competition = (formData.get("competition") as string) || null;
  const yearStr = formData.get("year") as string;
  const file = formData.get("file") as File | null;
  const videoFile = formData.get("videoFile") as File | null;
  const isPlaylist = formData.get("isPlaylist") === "true";
  const playlistItemsStr = (formData.get("playlistItems") as string) || "[]";
  const coverUrlInput = (formData.get("coverUrl") as string) || "";

  if (!title || !type || !category) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  if (!isKnownResourceType(type, taxonomy)) {
    return NextResponse.json({ error: "无效的资源类型" }, { status: 400 });
  }

  const typeZone = getResourceZoneForType(type, taxonomy);
  if (!isKnownCategory(category, typeZone, taxonomy)) {
    return NextResponse.json({ error: "无效的分类方向" }, { status: 400 });
  }

  let videoUrl: string | null = videoUrlInput.trim() || null;
  let playlistItems: string | null = null;

  if (isPlaylist) {
    if (!isVideoResourceType(type, taxonomy)) {
      return NextResponse.json({ error: "仅视频类型资源可开启选集模式" }, { status: 400 });
    }
    try {
      const parsed = JSON.parse(playlistItemsStr) as { id?: string; title: string; videoUrl: string }[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return NextResponse.json({ error: "选集模式至少需要添加一个视频" }, { status: 400 });
      }
      if (parsed.some((item) => !item.videoUrl?.trim())) {
        return NextResponse.json({ error: "选集内每个视频都需要填写链接或上传文件" }, { status: 400 });
      }
      playlistItems = playlistItemsStr;
    } catch {
      return NextResponse.json({ error: "选集数据格式错误" }, { status: 400 });
    }
  } else if (isVideoResourceType(type, taxonomy)) {
    if (videoFile && videoFile.size > 0) {
      if (!isVideoFile(videoFile.name)) {
        return NextResponse.json({ error: "不支持的视频格式，请上传 mp4 / webm / mov" }, { status: 400 });
      }
      const saved = await savePublicVideo(videoFile);
      videoUrl = saved.url;
    }

    if (!videoUrl) {
      return NextResponse.json({ error: "请填写视频链接或上传本地视频" }, { status: 400 });
    }
  }

  let filePath: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;

  if (file && file.size > 0 && isTemplateResourceType(type, taxonomy)) {
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, safeName), buffer);

    filePath = safeName;
    fileName = file.name;
    fileSize = file.size;
  }

  const status = session.user.role === Role.ADMIN ? "APPROVED" : "PENDING";

  const resource = await prisma.resource.create({
    data: {
      title,
      description,
      type,
      category,
      status,
      videoUrl: isPlaylist ? null : videoUrl,
      competition,
      year: yearStr ? parseInt(yearStr) : null,
      filePath,
      fileName,
      fileSize,
      isPlaylist,
      playlistItems: isPlaylist ? "[]" : null,
      coverUrl: coverUrlInput.trim() || null,
      authorId: session.user.id,
    },
  });

  if (isPlaylist && playlistItems) {
    const parsed = JSON.parse(playlistItems) as { id?: string; title: string; videoUrl: string }[];
    const normalized = normalizePlaylistItems(resource.id, parsed);
    await prisma.resource.update({
      where: { id: resource.id },
      data: { playlistItems: JSON.stringify(normalized) },
    });
    return NextResponse.json({ ...resource, playlistItems: JSON.stringify(normalized), isPlaylist: true });
  }

  return NextResponse.json(resource);
}
