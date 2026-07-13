import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { canDeleteUserContent } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      resourceId: id,
      userId: session.user.id,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const commentId = req.nextUrl.searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "缺少评论 ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, resourceId: id },
    select: { id: true, userId: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }

  if (!canDeleteUserContent(session.user.role, session.user.id, comment.userId)) {
    return NextResponse.json({ error: "无权删除此评论" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
