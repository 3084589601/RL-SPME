import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDatabase } from "@/lib/safe-database";
import { canAccessResources } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!canAccessResources(session?.user?.role)) {
    return NextResponse.json([], { status: 403 });
  }

  const items = await withDatabase([], () =>
    prisma.resource.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        category: true,
        createdAt: true,
      },
    })
  );

  return NextResponse.json(items);
}