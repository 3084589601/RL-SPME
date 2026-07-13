import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  if (target.username === "admin") {
    return NextResponse.json({ error: "不能修改默认管理员" }, { status: 400 });
  }

  const { role, name } = await req.json();
  const data: { role?: Role; name?: string } = {};
  if (name?.trim()) data.name = name.trim();
  if (role === Role.ADMIN || role === Role.MEMBER) data.role = role;
  if (role === Role.GUEST) {
    return NextResponse.json({ error: "游客无需账号，请使用删除用户" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, name: true, role: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
