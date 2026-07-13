function resolveSqlitePath(): string | null {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:")) return null;
  const raw = url.replace(/^file:/, "").trim();

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("path") as typeof import("path");
  if (path.isAbsolute(raw)) return raw;

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, raw),
    path.join(cwd, "prisma", raw),
    path.join(cwd, "prisma", path.basename(raw)),
  ];

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return path.join(cwd, "prisma", path.basename(raw));
}

export function isDatabaseAvailable(): boolean {
  if (typeof window !== "undefined") return true;

  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  if (!url.startsWith("file:")) return true;

  const dbPath = resolveSqlitePath();
  if (!dbPath) return false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    return fs.existsSync(dbPath);
  } catch {
    return false;
  }
}
