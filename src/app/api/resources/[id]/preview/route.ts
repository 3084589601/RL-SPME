import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { Role } from "@prisma/client";
import { canAccessResources } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || !canAccessResources(session.user.role)) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource?.filePath) {
    return NextResponse.json({ error: "无可预览文件" }, { status: 404 });
  }

  if (session.user.role !== Role.ADMIN && resource.status !== "APPROVED") {
    return NextResponse.json({ error: "资源未审核" }, { status: 403 });
  }

  try {
    const filePath = path.join(process.cwd(), "uploads", resource.filePath);
    const content = await readFile(filePath, "utf-8");
    return NextResponse.json({ content: content.slice(0, 50000) });
  } catch {
    return NextResponse.json({ error: "文件无法预览" }, { status: 400 });
  }
}
