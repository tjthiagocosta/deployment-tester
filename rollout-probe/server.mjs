// App-rollout fixture (#342, #349, #353, #372, #373, #374, #408).
// FAIL_START=1: exit before listening, so the candidate fails readiness.
// CRASH_AFTER_MS=<ms>: serve, then exit 1 after that long, so the restart policy keeps the
// release in a loop that is up most of the time (Docker restarts it after 100 ms once it ran 10 s).
// IGNORE_SIGTERM=1: keep serving through SIGTERM, so retirement must fall back to SIGKILL.
// DATA_DIR (e.g. a volume mount): each boot appends a line, proving the volume survived.
import { appendFileSync, readFileSync } from "node:fs";
import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 3000);
const label = process.env.VERSION ?? process.env.NOUVA_DEPLOYMENT_ID ?? "unknown";
const now = () => new Date().toISOString();

if (process.env.FAIL_START === "1") {
  console.log(`PROBE ${now()} failing start on purpose (FAIL_START=1) version=${label}`);
  process.exit(1);
}

let boots = "";
if (process.env.DATA_DIR) {
  const file = `${process.env.DATA_DIR}/boots.log`;
  appendFileSync(file, `${now()} ${label}\n`);
  boots = readFileSync(file, "utf8");
}

process.on("SIGTERM", () => {
  if (process.env.IGNORE_SIGTERM === "1") {
    console.log(`PROBE ${now()} got SIGTERM, ignoring it (IGNORE_SIGTERM=1) version=${label}`);
    return;
  }
  console.log(`PROBE ${now()} got SIGTERM, exiting version=${label}`);
  process.exit(0);
});

createServer((req, res) => {
  res.setHeader("content-type", "text/plain");
  res.end(`rollout-probe version=${label} host=${process.env.HOSTNAME}\n${boots}`);
}).listen(port, () => console.log(`PROBE ${now()} listening on ${port} version=${label}`));

const crashAfterMs = Number(process.env.CRASH_AFTER_MS);
if (Number.isFinite(crashAfterMs) && crashAfterMs > 0) {
  setTimeout(() => {
    console.log(`PROBE ${now()} crashing on purpose (CRASH_AFTER_MS=${crashAfterMs}) version=${label}`);
    process.exit(1);
  }, crashAfterMs);
}
