import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "发票不存在" }, { status: 404 });
  }

  // 成员只能删除自己的发票，管理员可删除任意
  if (session.user.role !== Role.ADMIN && invoice.userId !== session.user.id) {
    return NextResponse.json({ error: "无权删除" }, { status: 403 });
  }

  // 删除磁盘上的文件
  try {
    const filePath = path.join(process.cwd(), "uploads", "invoices", invoice.filePath);
    await unlink(filePath);
  } catch {
    // 文件可能已不存在，继续删除数据库记录
  }

  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
