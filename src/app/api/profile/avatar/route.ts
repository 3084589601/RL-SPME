import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { isImageFile, savePublicImage } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "请选择图片文件" }, { status: 400 });
  }

  if (!isImageFile(file.name)) {
    return NextResponse.json({ error: "仅支持 JPG、PNG、GIF、WebP 等图片格式" }, { status: 400 });
  }

  try {
    const { url } = await savePublicImage(file, "thumb");
    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: url },
    });
    return NextResponse.json({ avatar: url });
  } catch (err) {
    return NextResponse.json({ error: "头像上传失败，请重试" }, { status: 500 });
  }
}
