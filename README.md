# deployment-tester

Framework build roots and deployment settings are listed in [FRAMEWORKS.md](FRAMEWORKS.md).
Local validation commands are in [CLAUDE.md](CLAUDE.md).

## PostgreSQL test branch

The `test/database-deployment-cases` branch adds a PostgreSQL probe to each server fixture.
Set `DATABASE_URL` in the service runtime environment and request `/db-test`. A successful
response contains `ok: true`, `database: "postgresql"`, the framework, and a positive `counter`.
Each call increments and reads a committed database row. Call it before and after a
redeployment to confirm persistence.

Nouva's current PgBouncer endpoint requires TLS and provides a self-signed certificate in its
documented encrypt-only mode. The JavaScript probes default to `sslmode=require` with libpq
semantics: traffic is encrypted, but server identity is not verified. They never retry in
plaintext after a TLS error. This tests Nouva's current connection mode, not authenticated
server TLS. Explicit `verify-ca` and `verify-full` modes remain available when a trusted
certificate configuration is supplied. Plain local PostgreSQL tests must explicitly append
`?sslmode=disable` to their localhost test URL.

The root Vite service uses its Node server for `/db-test` and includes a Test PostgreSQL
button. `railpack-static` preserves its start-script-free Caddy deployment and calls an
Express companion: set its public build variable `VITE_DB_PROBE_URL` to the Express
service's full `https://<host>/db-test?fixture=railpack-static` URL. Only Express receives
`DATABASE_URL`; browser code receives no database credentials.

The intentional `failing-build` case still exits during build. Its expected test result is
retained failure logs, so it cannot produce a runtime database connection.
