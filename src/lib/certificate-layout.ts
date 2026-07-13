export const GRID_SLOTS_PER_ROW = 6;

export type CertificateLayoutItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  year: number | null;
  position: string;
  order: number;
  row: number;
};

export type CertificateSlot = {
  row: number;
  position: "left" | "grid";
  order: number;
};

export type CertificateLayoutRow = {
  row: number;
  left: CertificateLayoutItem | null;
  grid: CertificateLayoutItem[];
};

export function slotKey(slot: CertificateSlot): string {
  return `${slot.row}-${slot.position}-${slot.order}`;
}

export function slotFromKey(key: string): CertificateSlot {
  const [row, position, order] = key.split("-");
  return {
    row: Number(row),
    position: position === "left" ? "left" : "grid",
    order: Number(order),
  };
}

export function slotLabel(slot: CertificateSlot): string {
  if (slot.position === "left") return `第 ${slot.row + 1} 排 · 左侧竖版`;
  return `第 ${slot.row + 1} 排 · 宫格 ${slot.order + 1}`;
}

export function certToSlot(cert: Pick<CertificateLayoutItem, "row" | "position" | "order">): CertificateSlot {
  return {
    row: cert.row ?? 0,
    position: cert.position === "left" ? "left" : "grid",
    order: cert.position === "left" ? 0 : cert.order,
  };
}

export function buildSlotOptions(rowCount: number): CertificateSlot[] {
  const slots: CertificateSlot[] = [];
  for (let row = 0; row < rowCount; row++) {
    slots.push({ row, position: "left", order: 0 });
    for (let order = 0; order < GRID_SLOTS_PER_ROW; order++) {
      slots.push({ row, position: "grid", order });
    }
  }
  return slots;
}

export function groupCertificatesIntoRows(items: CertificateLayoutItem[]): CertificateLayoutRow[] {
  const rowMap = new Map<number, CertificateLayoutRow>();

  for (const item of items) {
    const row = item.row ?? 0;
    const normalized = { ...item, row };
    if (!rowMap.has(row)) {
      rowMap.set(row, { row, left: null, grid: [] });
    }
    const entry = rowMap.get(row)!;
    if (item.position === "left") {
      entry.left = normalized;
    } else {
      entry.grid.push(normalized);
    }
  }

  return [...rowMap.values()]
    .sort((a, b) => a.row - b.row)
    .map((entry) => ({
      ...entry,
      grid: entry.grid.sort((a, b) => a.order - b.order).slice(0, GRID_SLOTS_PER_ROW),
    }))
    .filter((entry) => entry.left || entry.grid.length > 0);
}

export function maxCertificateRow(items: Pick<CertificateLayoutItem, "row">[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map((item) => item.row ?? 0));
}

export function sortCertificates(items: CertificateLayoutItem[]): CertificateLayoutItem[] {
  return [...items].sort((a, b) => {
    const rowDiff = (a.row ?? 0) - (b.row ?? 0);
    if (rowDiff !== 0) return rowDiff;
    if (a.position === "left" && b.position !== "left") return -1;
    if (a.position !== "left" && b.position === "left") return 1;
    return a.order - b.order;
  });
}