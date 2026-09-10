# Exhausts the build container's memory on purpose.
#
# The builder BuildKit runs in is capped at a fixed share of host RAM (BUILD_RESERVE_POLICY: 15%,
# floored at 512 MiB, ceilinged at 2 GiB) and gets no swap, so a process that allocates without
# bound is killed by the kernel rather than slowed down. Before nouva-platform#240 that kill was
# reported to the customer as "BuildKit build failed", indistinguishable from a compile error, and
# the only memory control in the dashboard sizes the *running* container rather than the builder.
#
# `tail /dev/zero` is the shortest way to get there: it reads an endless stream into memory and
# never yields, so the step dies in seconds regardless of host size.
FROM alpine:3

RUN echo "NOUVA_PROBE: starting the out-of-memory build step" && \
    tail /dev/zero

# Never reached. Present so the fixture is a valid image apart from its build step.
EXPOSE 3000
CMD ["sh", "-c", "echo OOM_BUILD_LIVE; sleep infinity"]
