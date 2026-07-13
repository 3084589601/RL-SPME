const DB_TIMEOUT_MS = 2500;

export async function withDatabase<T>(fallback: T, query: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return fallback;
  if (!process.env.DATABASE_URL) return fallback;

  try {
    return await Promise.race([
      query(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("database timeout")), DB_TIMEOUT_MS)
      ),
    ]);
  } catch {
    return fallback;
  }
}
