import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { savePublicImage, isImageFile } from "@/lib/upload";
import { findCertificateSlotConflict, parseCertificateLayoutFields } from "@/lib/certificate-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

  const description = (formData.get("description") as string) || null;
  const yearStr = formData.get("year") as string;
  const { position, row, order } = parseCertificateLayoutFields(formData);
  const imageUrlInput = (formData.get("imageUrl") as string) || "";
  const file = formData.get("file") as File | null;

  const conflict = await findCertificateSlotConflict(row, position, order);
  if (conflict) {
    return NextResponse.json({ error: "该布局位置已被其他证书占用，请先调整或删除原证书" }, { status: 400 });
  }

  let imageUrl = imageUrlInput.trim();
  if (file && file.size > 0) {
    if (!isImageFile(file.name)) {
      return NextResponse.json({ error: "仅支持图片文件" }, { status: 400 });
    }
    const saved = await savePublicImage(file);
    imageUrl = saved.url;
  }
  if (!imageUrl) return NextResponse.json({ error: "请上传证书图片" }, { status: 400 });

  const cert = await prisma.certificate.create({
    data: {
      title,
      description,
      imageUrl,
      year: yearStr ? parseInt(yearStr, 10) : null,
      position,
      row,
      order: position === "left" ? 0 : order,
    },
  });

  return NextResponse.json(cert);
}
