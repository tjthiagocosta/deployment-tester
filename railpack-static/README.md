# railpack-static

Regression fixture for [#152](https://github.com/nouvacloud/nouva-platform/issues/152).

A plain Vite + React app with a `build` script and **no `start` script**, which is what
makes Railpack fall back to its static provider: it serves `dist/` with Caddy, and the
generated Caddyfile listens on `{$PORT}` — defaulting to `:80` when `PORT` is unset.

Before the fix, deploying this with no `PORT` service variable and a `NULL` internal port
failed every rollout with `Candidate container ... is not accepting TCP traffic on 3000`,
because the agent's `resolveAppPort` fell back to 3000 while Caddy listened on 80.

The agent now injects `PORT=<resolved appPort>` into the container environment, so the
probe, Traefik routing, and the app agree by construction.

**Deploy it with no `PORT` variable set** — that is the whole point of the fixture.
