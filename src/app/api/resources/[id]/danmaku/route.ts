import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { canDeleteUserContent } from "@/lib/permissions";

const MAX_LENGTH = 100;
const VALID_MODES = new Set(["scroll", "top", "bottom"]);
const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const from = parseFloat(req.nextUrl.searchParams.get("from") ?? "0");
  const to = parseFloat(req.nextUrl.searchParams.get("to") ?? "999999");

  const items = await prisma.danmaku.findMany({
    where: {
      resourceId: id,
      time: { gte: Math.max(0, from - 5), lte: to + 5 },
    },
    orderBy: { time: "asc" },
    select: {
      id: true,
      content: true,
      time: true,
      color: true,
      mode: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(items);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MEMBER)) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const body = await req.json();
  const content = String(body.content ?? "").trim();
  const time = Number(body.time);
  const color = String(body.color ?? "#FFFFFF");
  const mode = String(body.mode ?? "scroll");

  if (!content) {
    return NextResponse.json({ error: "弹幕内容不能为空" }, { status: 400 });
  }
  if (content.length > MAX_LENGTH) {
    return NextResponse.json({ error: `弹幕最多 ${MAX_LENGTH} 字` }, { status: 400 });
  }
  if (!Number.isFinite(time) || time < 0) {
    return NextResponse.json({ error: "时间无效" }, { status: 400 });
  }
  if (!COLOR_RE.test(color)) {
    return NextResponse.json({ error: "颜色无效" }, { status: 400 });
  }
  if (!VALID_MODES.has(mode)) {
    return NextResponse.json({ error: "弹幕类型无效" }, { status: 400 });
  }

  const resource = await prisma.resource.findUnique({ where: { id }, select: { id: true } });
  if (!resource) {
    return NextResponse.json({ error: "资源不存在" }, { status: 404 });
  }

  const item = await prisma.danmaku.create({
    data: {
      content,
      time,
      color,
      mode,
      resourceId: id,
      userId: session.user.id,
    },
    select: {
      id: true,
      content: true,
      time: true,
      color: true,
      mode: true,
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const danmakuId = req.nextUrl.searchParams.get("danmakuId");
  if (!danmakuId) {
    return NextResponse.json({ error: "缺少弹幕 ID" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "请先登录" }, { status: 403 });
  }

  const danmaku = await prisma.danmaku.findFirst({
    where: { id: danmakuId, resourceId: id },
    select: { id: true, userId: true },
  });
  if (!danmaku) {
    return NextResponse.json({ error: "弹幕不存在" }, { status: 404 });
  }

  if (!canDeleteUserContent(session.user.role, session.user.id, danmaku.userId)) {
    return NextResponse.json({ error: "无权删除此弹幕" }, { status: 403 });
  }

  await prisma.danmaku.delete({ where: { id: danmakuId } });
  return NextResponse.json({ ok: true });
}