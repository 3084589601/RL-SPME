import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { username, password, name, role } = await req.json();
  if (!username || !password || !name) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
      role: role === "ADMIN" ? Role.ADMIN : Role.MEMBER,
    },
    select: { id: true, username: true, name: true, role: true },
  });

  return NextResponse.json(user);
}
