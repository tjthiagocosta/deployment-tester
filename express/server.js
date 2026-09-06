import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get("/", (_req, res) => {
  res.type("html").send('<h1 id="probe-marker">EXPRESS_LIVE</h1>');
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, framework: "express", port, revision: "express-watch-2" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`express-probe listening on 0.0.0.0:${port}`);
});
