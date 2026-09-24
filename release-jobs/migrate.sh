#!/bin/sh
# #287 fixture: pre-activation job. Records which deployment ran it, then optionally fails.
set -e
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "create table if not exists release_marks(id serial primary key, deployment text, at timestamptz default now())"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "insert into release_marks(deployment) values ('${NOUVA_DEPLOYMENT_ID:-unknown}')"
echo "MIGRATE recorded ${NOUVA_DEPLOYMENT_ID:-unknown}"
if [ -n "$MIGRATE_SLEEP" ]; then sleep "$MIGRATE_SLEEP"; fi
if [ "$FAIL_MIGRATION" = "1" ]; then echo "MIGRATE failing on purpose"; exit 3; fi
