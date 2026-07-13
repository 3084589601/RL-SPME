import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const certificates = await prisma.certificate.findMany({
      orderBy: [
        { position: "asc" },
        { order: "asc" },
      ],
    });

    const items = certificates.map((cert) => ({
      id: cert.id,
      title: cert.title,
      description: cert.description,
      imageUrl: cert.imageUrl,
      year: cert.year,
      orientation: cert.position === "left" ? "portrait" : "landscape",
      position: cert.position,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch certificates:", error);
    return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
  }
}
