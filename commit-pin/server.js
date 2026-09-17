import { createServer } from "node:http";

// Bumped by hand between commits so a deployment proves WHICH commit it built (#286).
const PIN = "COMMIT_PIN_C";
const port = Number(process.env.PORT) || 3000;

createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, framework: "commit-pin", port, pin: PIN }));
    return;
  }
  res.writeHead(200, { "content-type": "text/html" });
  res.end(`<h1 id="probe-marker">${PIN}</h1>`);
}).listen(port, "0.0.0.0", () => {
  console.log(`commit-pin listening on 0.0.0.0:${port} with ${PIN}`);
});
