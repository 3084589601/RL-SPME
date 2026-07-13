import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const key = req.nextUrl.searchParams.get("key") || "lab_intro";
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
