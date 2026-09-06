// Never reached: the build always fails first. Present so Railpack detects a start command and
// the fixture only differs from a working app in its build step.
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 3000);

createServer((request, response) => {
  if (request.url === "/healthz") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, framework: "failing-build", port: String(port) }));
    return;
  }
  response.writeHead(200, { "content-type": "text/html" });
  response.end('<h1 id="probe-marker">FAILING_BUILD_LIVE</h1>');
}).listen(port, "0.0.0.0");
