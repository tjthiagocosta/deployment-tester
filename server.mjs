// Minimal static file server for the built Vite bundle.
// Listens on PORT when set, otherwise 3000 (the Nouva agent's default probe port),
// so deployments work even when the service has no PORT variable.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runDatabaseProbe } from "./db-test.js";

const root = resolve(fileURLToPath(new URL("./dist/", import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? "", 10) || 3000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

async function send(res, path, status = 200) {
  const body = await readFile(path);
  res.writeHead(status, {
    "content-type": types[extname(path)] ?? "application/octet-stream",
    "content-length": body.length,
    "cache-control": "no-store",
  });
  res.end(body);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname === "/db-test") {
      try {
        const result = await runDatabaseProbe(process.env.DATABASE_URL, "vite-node");
        res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify(result));
      } catch {
        console.error("Database probe failed for vite-node");
        res.writeHead(503, { "content-type": "application/json", "cache-control": "no-store" });
        res.end(JSON.stringify({ ok: false, framework: "vite-node", error: "Database probe failed" }));
      }
      return;
    }
    const relative = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    const candidate = resolve(join(root, relative));
    if (candidate.startsWith(root) && candidate !== root && extname(candidate)) {
      try {
        await send(res, candidate);
        return;
      } catch {
        // fall through to the SPA entry point
      }
    }
    await send(res, join(root, "index.html"));
  } catch {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("internal error");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`deployment-tester listening on ${port}`);
});
