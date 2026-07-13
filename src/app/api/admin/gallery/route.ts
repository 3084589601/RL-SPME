import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { savePublicImage, isImageFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  const formData = await req.formData();
  const title = (formData.get("title") as string)?.trim();
  const type = (formData.get("type") as string) || "work";
  if (!title) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });

  const description = (formData.get("description") as string) || null;
  const yearStr = formData.get("year") as string;
  const orderStr = formData.get("order") as string;
  const teamName = (formData.get("teamName") as string) || null;
  const imageUrlInput = (formData.get("imageUrl") as string) || "";
  const teamPhotoUrlInput = (formData.get("teamPhotoUrl") as string) || "";
  const highlightsJson = (formData.get("highlightsJson") as string) || null;
  const membersJson = (formData.get("membersJson") as string) || null;
  const file = formData.get("file") as File | null;
  const teamPhotoFile = formData.get("teamPhotoFile") as File | null;

  let imageUrl = imageUrlInput.trim();
  if (file && file.size > 0) {
    if (!isImageFile(file.name)) {
      return NextResponse.json({ error: "仅支持图片文件" }, { status: 400 });
    }
    const saved = await savePublicImage(file);
    imageUrl = saved.url;
  }
  if (!imageUrl) imageUrl = "/uploads/placeholder-gallery-1.svg";

  let teamPhotoUrl = teamPhotoUrlInput.trim() || null;
  if (teamPhotoFile && teamPhotoFile.size > 0) {
    if (!isImageFile(teamPhotoFile.name)) {
      return NextResponse.json({ error: "队伍合照仅支持图片" }, { status: 400 });
    }
    const saved = await savePublicImage(teamPhotoFile);
    teamPhotoUrl = saved.url;
  }

  const item = await prisma.galleryItem.create({
    data: {
      title,
      description,
      type,
      imageUrl,
      year: yearStr ? parseInt(yearStr, 10) : null,
      order: orderStr ? parseInt(orderStr, 10) : 0,
      teamName,
      teamPhotoUrl,
      highlightsJson,
      membersJson,
    },
  });

  revalidateTag("gallery-items");
  revalidatePath("/gallery");
  if (type === "work") revalidatePath(`/gallery/works/${item.id}`);

  return NextResponse.json(item);
}
