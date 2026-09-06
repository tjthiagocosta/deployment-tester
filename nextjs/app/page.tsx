export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main>
      <h1 id="probe-marker">NEXTJS_LIVE</h1>
      <p>port={process.env.PORT ?? "unset"}</p>
    </main>
  );
}
