import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { savePublicImage, isImageFile } from "@/lib/upload";
import { findCertificateSlotConflict, parseCertificateLayoutFields } from "@/lib/certificate-admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const formData = await req.formData();
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;
  const yearStr = formData.get("year") as string | null;
  const imageUrlInput = formData.get("imageUrl") as string | null;
  const file = formData.get("file") as File | null;

  const existing = await prisma.certificate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "证书不存在" }, { status: 404 });

  const layout = parseCertificateLayoutFields(formData);
  const nextRow = formData.has("row") ? layout.row : existing.row;
  const nextPosition = formData.has("position") ? layout.position : existing.position;
  const nextOrder = formData.has("order")
    ? layout.order
    : existing.order;

  const conflict = await findCertificateSlotConflict(
    nextRow,
    nextPosition,
    nextPosition === "left" ? 0 : nextOrder,
    id
  );
  if (conflict) {
    return NextResponse.json({ error: "该布局位置已被其他证书占用，请先调整或删除原证书" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (title) data.title = title.trim();
  if (description !== null) data.description = description || null;
  if (yearStr !== null) data.year = yearStr ? parseInt(yearStr, 10) : null;
  if (formData.has("position")) data.position = nextPosition;
  if (formData.has("row")) data.row = nextRow;
  if (formData.has("order")) data.order = nextPosition === "left" ? 0 : nextOrder;
  if (imageUrlInput) data.imageUrl = imageUrlInput.trim();

  if (file && file.size > 0) {
    if (!isImageFile(file.name)) {
      return NextResponse.json({ error: "仅支持图片文件" }, { status: 400 });
    }
    const saved = await savePublicImage(file);
    data.imageUrl = saved.url;
  }

  const cert = await prisma.certificate.update({ where: { id }, data });
  return NextResponse.json(cert);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.certificate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
