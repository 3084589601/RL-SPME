import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { saveInvoiceFile } from "@/lib/upload";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "请上传 PDF 文件" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "请选择 PDF 文件" }, { status: 400 });
  }

  try {
    const { url: filePath, filename: fileName, fileSize } = await saveInvoiceFile(file);

    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        fileName,
        filePath,
        fileSize,
      },
    });

    return NextResponse.json(invoice);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "上传失败，请重试";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
