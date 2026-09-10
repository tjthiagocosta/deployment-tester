# Prints strings the build-log redactor used to destroy, plus one it must still destroy.
#
# Deploy with an env var referencing a Postgres service (e.g. DATABASE_URL=${{db.DATABASE_URL}}).
# That reference is what pulls the *generated* catalog into the deployment's build environment map —
# PGSSLMODE=require, PGDATABASE, PGUSER and friends — which is where the damage came from: every
# token of 3+ characters was matched by plain substring, so the literal `require` turned
# `requirements.txt` into `[REDACTED]ments.txt`. Variable *names* were tokens too, so a build that
# merely mentioned `DATABASE_URL` had the name masked.
#
# Also set PROBE_SECRET=zzsecretvaluezz. That one is a customer value and MUST still be masked, glued
# inside a longer word, or the fix went too far.
#
# Bump PROBE_MARKER on every re-run: a cached RUN layer prints nothing, and a probe that prints
# nothing passes every assertion vacuously.
#
# See nouva-platform#219 (report), #245 (control-plane fix) and #262 (agent and REST fix).
FROM alpine:3

COPY requirements.txt /probe/requirements.txt

RUN echo "NOUVA_PROBE_MARKER: run-2" && \
    echo "NOUVA_PROBE_KEEP: pip install -r requirements.txt" && \
    echo "NOUVA_PROBE_KEEP: this package requires a newer runtime" && \
    echo "NOUVA_PROBE_KEEP: 2 packages required, 0 satisfied" && \
    echo "NOUVA_PROBE_KEEP: reading PGSSLMODE and DATABASE_URL from the environment" && \
    echo "NOUVA_PROBE_KEEP: installing postgresql-client" && \
    ls /probe/requirements.txt && \
    echo "NOUVA_PROBE_MASK: prefixzzsecretvaluezzsuffix"

EXPOSE 3000
# Serves so the deploy reaches LIVE instead of failing readiness; the build log is what is under
# test, but a failed deploy buries it under a readiness error.
CMD ["sh", "-c", "echo REDACTION_PROBE_LIVE; mkdir -p /www && echo ok > /www/index.html && httpd -f -p 3000 -h /www"]
