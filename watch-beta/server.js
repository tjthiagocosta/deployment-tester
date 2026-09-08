import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { runDatabaseProbe } from "./db-test.js";

const port = Number(process.env.PORT ?? 3000);
// Bumped by the watch-path fixtures so a deployment can be identified by what it serves.
const revision = readFileSync(new URL("./REVISION", import.meta.url), "utf8").trim();

createServer(async (request, response) => {
  if (request.url === "/db-test") {
    try {
      const result = await runDatabaseProbe(process.env.DATABASE_URL, "watch-beta");
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify(result));
    } catch {
      console.error("Database probe failed for watch-beta");
      response.writeHead(503, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ ok: false, framework: "watch-beta", error: "Database probe failed" }));
    }
    return;
  }
  if (request.url === "/healthz") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, framework: "watch-beta", revision, port }));
    return;
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(`<h1 id="probe-marker">WATCH_BETA_LIVE</h1><p id="revision">${revision}</p>`);
}).listen(port, "0.0.0.0", () => {
  console.log(`watch-beta revision ${revision} listening on ${port}`);
});
