import express from "express";
import { runDatabaseProbe } from "./db-test.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/db-test", async (req, res) => {
  const fixture = req.query.fixture === "railpack-static" ? "railpack-static" : "express";
  // This public probe returns only a counter and accepts no cookies or credentials.
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Cache-Control", "no-store");
  try {
    res.json(await runDatabaseProbe(process.env.DATABASE_URL, fixture));
  } catch {
    console.error(`Database probe failed for ${fixture}`);
    res.status(503).json({ ok: false, framework: fixture, error: "Database probe failed" });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send('<h1 id="probe-marker">EXPRESS_LIVE</h1>');
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, framework: "express", port, revision: "express-watch-2" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`express-probe listening on 0.0.0.0:${port}`);
});

// touched to prove an explicit watch list overrides the build root (#185)
