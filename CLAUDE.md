# Deployment fixture commands

Each build root is independent. Run commands from the corresponding folder.

## JavaScript and TypeScript

- Install: `bun install`
- Root, Next.js and railpack-static build: `bun run build`
- Typecheck: `bunx tsc --noEmit` in root, `nextjs`, and `railpack-static`
- JavaScript syntax check: `node --check server.js` (root uses `server.mjs`)
- Database tests: `bun test db-test.test.js` in root, `express`, `watch-alpha`, and `watch-beta`
- Run one database test: `bun test db-test.test.js -t "rejects a missing database URL"`
- Run locally: `bun run start` for server fixtures, `bun run dev` for Vite
- No linter is configured in this fixture repository. Do not add one for deployment probes.

## Python

- Install: `python3 -m pip install -r requirements.txt`
- Syntax: `python3 -m compileall .`
- Database tests in FastAPI and Django: `python -m unittest test_db_probe -v` with disposable `DATABASE_URL`
- FastAPI run: `uvicorn main:app --host 0.0.0.0 --port 3000`
- Django check: `python3 manage.py check`
- Django run: `gunicorn config.wsgi:application --bind 0.0.0.0:3000`

## Compiled runtimes

- Gin install: `go mod download`; test: `go test ./...`; build: `go build ./...`; run: `go run .`
- Axum check: `cargo check`; test: `cargo test`; build: `cargo build --release`; run: `cargo run`
- Spring Boot test: `./mvnw test`; package: `./mvnw package`; run: `./mvnw spring-boot:run`

## Ruby, PHP and Elixir

- Rails install: `bundle install`; run: `bin/rails server -b 0.0.0.0 -p 3000`; lint: `bin/rubocop`
- Rails database test: `bundle exec ruby test/db_probe_test.rb` with disposable `DATABASE_URL`
- Laravel install: `composer install`; test: `php artisan test`; run: `php artisan serve --host=0.0.0.0 --port=3000`; lint: `vendor/bin/pint --test`
- Laravel database test: `php tests/database-probe.php` with disposable `DATABASE_URL`, valid `APP_KEY`, `SESSION_DRIVER=array`, and `CACHE_STORE=array`
- Phoenix install: `mix deps.get`; compile: `mix compile`; test: `mix test`; run: `mix phx.server`

## Live database proof

Server-side fixtures use PostgreSQL `DATABASE_URL`. A successful GET `/db-test` must return
`ok: true`, `database: "postgresql"`, its framework, and a persisted integer counter. Repeat
after redeployment to prove data survives process replacement. No database URL belongs in a
browser variable. `railpack-static` uses the public Express companion URL in
`VITE_DB_PROBE_URL` (the full `/db-test?fixture=railpack-static` URL).

`failing-build` intentionally fails and cannot execute a runtime database probe.

Some runtime toolchains are unavailable on a given workstation. Report that limitation and
validate their actual Railpack builds and live endpoints on the test server.
