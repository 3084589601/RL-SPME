import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { getCarouselSlidesFromFolder } from "@/lib/media";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const key = req.nextUrl.searchParams.get("key") || "lab_intro";
  const from = req.nextUrl.searchParams.get("from");

  // "从文件夹恢复" — 直接返回文件夹中的轮播图片
  if (key === "home_carousel" && from === "folder") {
    const folderSlides = getCarouselSlidesFromFolder();
    return NextResponse.json({ key, content: folderSlides, from: "folder" });
  }

  const row = await prisma.siteContent.findUnique({ where: { key } });
  if (!row) return NextResponse.json({ key, content: null });

  try {
    return NextResponse.json({ key, content: JSON.parse(row.content) });
  } catch {
    return NextResponse.json({ key, content: row.content });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const key = body.key || "lab_intro";
  const content = body.content;
  const titleMap: Record<string, string> = {
    lab_intro: "实验室概况",
    home_carousel: "首页轮播",
  };

  await prisma.siteContent.upsert({
    where: { key },
    update: { content: JSON.stringify(content) },
    create: { key, title: titleMap[key] || key, content: JSON.stringify(content) },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const key = req.nextUrl.searchParams.get("key") || "lab_intro";
  await prisma.siteContent.deleteMany({ where: { key } });

  return NextResponse.json({ success: true, message: "已删除，将自动使用文件夹中的默认图片" });
}
