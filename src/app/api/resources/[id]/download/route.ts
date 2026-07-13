import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { Role } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.redirect(new URL("/login", _req.url));
  }

  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource?.filePath) {
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }

  if (session.user.role !== Role.ADMIN && resource.status !== "APPROVED") {
    return NextResponse.json({ error: "资源未审核" }, { status: 403 });
  }

  await prisma.downloadLog.create({
    data: { resourceId: id, userId: session.user.id },
  });

  try {
    const filePath = path.join(process.cwd(), "uploads", resource.filePath);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(resource.fileName || "download")}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "文件读取失败" }, { status: 500 });
  }
}
