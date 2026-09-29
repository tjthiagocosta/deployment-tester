// #360 fixture: built with context ./services/api and dockerfile ../shared/Dockerfile.
require("node:http")
  .createServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true, fixture: "compose-split-context" }));
  })
  .listen(Number(process.env.PORT ?? 8080), () => console.log("split-context api listening"));
