export async function checkDatabase(
  url: string | undefined,
  request: typeof fetch
): Promise<number> {
  if (!url) throw new Error("Set VITE_DB_PROBE_URL to the companion API database probe URL.");
  const response = await request(url, { cache: "no-store", credentials: "omit" });
  const result: unknown = await response.json();
  if (
    !response.ok ||
    typeof result !== "object" ||
    result === null ||
    !("ok" in result) ||
    result.ok !== true ||
    !("database" in result) ||
    result.database !== "postgresql" ||
    !("counter" in result) ||
    typeof result.counter !== "number" ||
    !Number.isSafeInteger(result.counter) ||
    result.counter < 1
  ) {
    throw new Error("Database probe failed. Check the companion API configuration.");
  }
  return result.counter;
}
