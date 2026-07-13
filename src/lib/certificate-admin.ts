import { prisma } from "@/lib/prisma";

export async function findCertificateSlotConflict(
  row: number,
  position: string,
  order: number,
  excludeId?: string
) {
  const where: {
    row: number;
    position: string;
    order?: number;
    NOT?: { id: string };
  } = {
    row,
    position: position === "left" ? "left" : "grid",
  };

  if (position !== "left") {
    where.order = order;
  }

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  return prisma.certificate.findFirst({ where });
}

export function parseCertificateLayoutFields(formData: FormData) {
  const position = (formData.get("position") as string) || "grid";
  const rowStr = formData.get("row") as string;
  const orderStr = formData.get("order") as string;

  return {
    position: position === "left" ? "left" : "grid",
    row: rowStr ? parseInt(rowStr, 10) : 0,
    order: orderStr ? parseInt(orderStr, 10) : 0,
  };
}