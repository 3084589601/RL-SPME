import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { savePublicImage, isImageFile } from "@/lib/upload";

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
  const orderStr = formData.get("order") as string | null;
  const teamName = formData.get("teamName") as string | null;
  const imageUrlInput = formData.get("imageUrl") as string | null;
  const teamPhotoUrlInput = formData.get("teamPhotoUrl") as string | null;
  const highlightsJson = formData.get("highlightsJson") as string | null;
  const membersJson = formData.get("membersJson") as string | null;
  const file = formData.get("file") as File | null;
  const teamPhotoFile = formData.get("teamPhotoFile") as File | null;

  const data: Record<string, unknown> = {};
  if (title) data.title = title.trim();
  if (description !== null) data.description = description || null;
  if (yearStr !== null) data.year = yearStr ? parseInt(yearStr, 10) : null;
  if (orderStr !== null) data.order = orderStr ? parseInt(orderStr, 10) : 0;
  if (teamName !== null) data.teamName = teamName || null;
  if (imageUrlInput !== null) {
    const trimmed = imageUrlInput.trim();
    if (trimmed) data.imageUrl = trimmed;
  }
  if (teamPhotoUrlInput !== null) data.teamPhotoUrl = teamPhotoUrlInput.trim() || null;
  if (highlightsJson !== null) data.highlightsJson = highlightsJson || null;
  if (membersJson !== null) data.membersJson = membersJson || null;

  if (file && file.size > 0) {
    if (!isImageFile(file.name)) {
      return NextResponse.json({ error: "仅支持图片文件" }, { status: 400 });
    }
    const saved = await savePublicImage(file);
    data.imageUrl = saved.url;
  }

  if (teamPhotoFile && teamPhotoFile.size > 0) {
    if (!isImageFile(teamPhotoFile.name)) {
      return NextResponse.json({ error: "队伍合照仅支持图片" }, { status: 400 });
    }
    const saved = await savePublicImage(teamPhotoFile);
    data.teamPhotoUrl = saved.url;
  }

  const item = await prisma.galleryItem.update({ where: { id }, data });
  revalidateTag("gallery-items");
  revalidatePath("/gallery");
  revalidatePath(`/gallery/works/${id}`);
  return NextResponse.json(item);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  await prisma.galleryItem.delete({ where: { id } });
  revalidateTag("gallery-items");
  revalidatePath("/gallery");
  revalidatePath(`/gallery/works/${id}`);
  return NextResponse.json({ success: true });
}
