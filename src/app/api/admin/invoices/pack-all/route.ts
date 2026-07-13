import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { existsSync } from "fs";
import path from "path";
import type { Archiver } from "archiver";

const archiver = require("archiver") as unknown as (format: string, options?: Record<string, unknown>) => Archiver;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (invoices.length === 0) {
    return NextResponse.json({ error: "全站暂无发票" }, { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 5 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<void>((resolve, reject) => {
    archive.on("end", resolve);
    archive.on("error", reject);
  });

  for (const inv of invoices) {
    const filePath = path.join(process.cwd(), "uploads", "invoices", inv.filePath);
    if (existsSync(filePath)) {
      const folderName = inv.user.name.replace(/[<>:"/\\|?*]/g, "_");
      archive.file(filePath, { name: `${folderName}/${inv.fileName}` });
    }
  }

  archive.finalize();

  try {
    await done;
  } catch {
    return NextResponse.json({ error: "打包失败" }, { status: 500 });
  }

  const zipBuffer = Buffer.concat(chunks);
  const timestamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''%E5%85%A8%E7%AB%99%E5%8F%91%E7%A5%A8%E6%89%93%E5%8C%85_${timestamp}.zip`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
