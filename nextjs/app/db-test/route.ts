import { runDatabaseProbe } from "../../db-test.js";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const result = await runDatabaseProbe(process.env.DATABASE_URL, "nextjs");
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Database probe failed for nextjs");
    return Response.json(
      { ok: false, framework: "nextjs", error: "Database probe failed" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
