import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { savePublicImage, savePublicVideo, isImageFile, isVideoFile, type ImageProfile } from "@/lib/upload";

export const runtime = "nodejs";
export const maxDuration = 1800;

const PROFILES = new Set<ImageProfile>(["hero", "content", "thumb"]);

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const profileRaw = (formData.get("profile") as string) || "content";
  const profile: ImageProfile = PROFILES.has(profileRaw as ImageProfile)
    ? (profileRaw as ImageProfile)
    : "content";

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  if (isImageFile(file.name)) {
    const saved = await savePublicImage(file, profile);
    return NextResponse.json({ url: saved.url, type: "image" });
  }

  if (isVideoFile(file.name)) {
    const saved = await savePublicVideo(file);
    return NextResponse.json({ url: saved.url, type: "video" });
  }

  return NextResponse.json({ error: "仅支持图片或视频文件（jpg/png/webp/mp4 等）" }, { status: 400 });
}
