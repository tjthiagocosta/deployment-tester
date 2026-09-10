# oom-build

Reproduces a build the kernel kills for exceeding the builder's memory cgroup.

Deploy it as a **Dockerfile** app with build path `oom-build`. The build must fail with a message
naming memory and the builder's budget, not the generic `BuildKit build failed`:

> The build ran out of memory. Its builder is limited to <N> MiB, a fixed share of the server's
> memory that the service's own memory limit does not change. Lower what the build needs (for
> example reduce build parallelism or disable source maps) or run it on a server with more memory.

`<N>` is `15%` of host RAM (min 512 MiB, max 2 GiB) — 571 MiB on a 3,900,644 kB host.

The OOM has to happen **inside** the scoped BuildKit daemon. Railpack's host-side prepare step is
deliberately classified as `unknown`, so a fixture that blows up there proves nothing.

See nouva-platform#215 (report) and #240 (fix).
