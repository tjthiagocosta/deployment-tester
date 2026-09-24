import { createServer } from "node:http";
// #287 fixture: /health fails when FAIL_VERIFY=1 so the verification gate can be exercised.
const port = Number(process.env.PORT) || 3000;
const marker = process.env.RELEASE_MARKER ?? "RELEASE_JOBS_LIVE";
createServer((req, res) => {
  if (req.url === "/health") {
    const ok = process.env.FAIL_VERIFY !== "1";
    res.writeHead(ok ? 200 : 500, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok, marker }));
    return;
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(`<h1 id="probe-marker">${marker}</h1>`);
}).listen(port, "0.0.0.0", () => console.log(`release-jobs listening on ${port} ${marker}`));
