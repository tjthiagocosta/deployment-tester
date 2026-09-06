export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, framework: "nextjs", port: process.env.PORT ?? null });
}
