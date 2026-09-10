# host-kill-build

Reproduces a build stopped by something outside it, rather than by its own builder budget.

Deploy it as a **Dockerfile** app with build path `host-kill-build`, then, on the customer server,
SIGKILL the `buildctl` client while the build is in flight:

```sh
kill -9 "$(pgrep -f '^buildctl --addr')"
```

The deployment must fail with a message that blames the server and names no budget:

> The build was stopped by the server: something outside the build killed its process, most often
> the host reclaiming memory while other work ran alongside it. Retry the deployment, and if it
> keeps happening check what else the server is running while builds are in flight.

It must **not** contain `MiB` or "ran out of memory". Attaching the builder's budget to a kill the
builder did not cause is an explicit denial of the real cause, which is what nouva-cloud#255 fixed.

The `RUN ... sleep 600` exists only to widen the window: a cached build spends under a second in
`buildctl`, which is too short to kill by hand.

See ../oom-build for the opposite case — a kill the builder's budget really does explain.

<!-- probe run: 2026-09-10T19:40:08Z -->
