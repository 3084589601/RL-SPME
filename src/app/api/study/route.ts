import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const { category, duration, note, resourceId } = await req.json();
  if (!category || !duration || duration <= 0) {
    return NextResponse.json({ error: "无效参数" }, { status: 400 });
  }

  const sessionRecord = await prisma.studySession.create({
    data: {
      userId: session.user.id,
      category,
      duration: Math.min(duration, 86400),
      note: note || null,
      resourceId: resourceId || null,
    },
  });

  return NextResponse.json(sessionRecord);
}
