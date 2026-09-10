# Holds a build open so it can be killed from outside the build.
#
# The complement to ../oom-build. That fixture dies inside the builder's memory cgroup, which the
# agent must report against the builder's budget. This one never touches memory at all: it just
# keeps the step running long enough for an operator (or the host reclaiming memory under other
# work) to SIGKILL the `buildctl` client driving it.
#
# `buildctl` runs on the agent host and talks to the scoped daemon over TCP, so the builder's
# cgroup cannot kill it. A SIGKILL on it therefore came from outside the build, and must be
# reported as such rather than as the service's builder budget — the misattribution nouva-cloud#255
# removed.
FROM alpine:3

RUN echo "NOUVA_PROBE: holding the build open for an external kill" && sleep 600

# Never reached. Present so the fixture is a valid image apart from its build step.
EXPOSE 3000
CMD ["sh", "-c", "echo HOST_KILL_BUILD_LIVE; sleep infinity"]
