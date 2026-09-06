# Framework deployment fixtures

Each subfolder is a minimal, idiomatic app for one framework, used to smoke-test Nouva
deployments. Create a service pointed at this repo and set **Build root** to the folder name.

Every app:

- binds `$PORT` on `0.0.0.0` (the agent always injects `PORT`, see nouva-platform#152)
- serves `<h1 id="probe-marker">&lt;FRAMEWORK&gt;_LIVE</h1>` on `/`
- serves `{"ok":true,"framework":...,"port":...}` on `/healthz`

So a deployment is verified by `curl -s https://<host>/ | grep <FRAMEWORK>_LIVE`.

| Build root       | Language   | Framework       | Marker              | Required service variables |
| ---------------- | ---------- | --------------- | ------------------- | -------------------------- |
| `nextjs`         | TypeScript | Next.js 15      | `NEXTJS_LIVE`       | –                          |
| `express`        | JavaScript | Express 4       | `EXPRESS_LIVE`      | –                          |
| `fastapi`        | Python     | FastAPI         | `FASTAPI_LIVE`      | –                          |
| `django`         | Python     | Django 5        | `DJANGO_LIVE`       | –                          |
| `gin`            | Go         | Gin             | `GIN_LIVE`          | –                          |
| `axum`           | Rust       | Axum            | `AXUM_LIVE`         | –                          |
| `springboot`     | Java       | Spring Boot 4   | `SPRINGBOOT_LIVE`   | –                          |
| `laravel`        | PHP        | Laravel 13      | `LARAVEL_LIVE`      | `APP_KEY`                  |
| `rails`          | Ruby       | Rails 8 (API)   | `RAILS_LIVE`        | `SECRET_KEY_BASE`          |
| `phoenix`        | Elixir     | Phoenix 1.7     | `PHOENIX_LIVE`      | `SECRET_KEY_BASE`          |
| `railpack-static`| TypeScript | Vite (static)   | `RAILPACK_STATIC_LIVE` | –                       |

## Generating the required secrets

- `APP_KEY` — `base64:$(openssl rand -base64 32)`
- `SECRET_KEY_BASE` — `openssl rand -hex 64`

## Notes

- `railpack-static` is deliberately **start-script-free** so Railpack picks its static provider.
  It is the regression fixture for nouva-platform#152 and must deploy with no `PORT` variable set.
- `rails` has `kamal` and `thruster` removed from the Gemfile: they are deploy tooling that a
  Nouva user would not keep, and they make `bundle install` noticeably slower on a small server.
- `axum` pins `opt-level = 1` / `codegen-units = 16` in its release profile so the build fits in
  a 2 GB server.
- `laravel` pins `config.platform.php` to `8.3.33` in `composer.json`, which is the PHP that
  Railpack's `dunglas/frankenphp:php8.3.33-bookworm` base ships. Without it, resolving the lock on
  a newer local PHP pulls Symfony 8.x (`php >=8.4.1`) and `composer install` fails inside the
  build. Regenerate the lock with `composer update` after changing that pin.
- `laravel` ships a `railpack.json` that turns the app stateless: Railpack's Laravel start script
  runs `php artisan migrate --force` unless `RAILPACK_SKIP_MIGRATIONS=true`, and Laravel's default
  `SESSION_DRIVER=database` hits SQLite on the first request. The fixture has no database, so the
  file it points at never exists and every request 500s. The config skips migrations and moves
  session/cache/queue to `cookie`/`array`/`sync`.
- `rails` must set `RAILS_ENV=production` itself — Railpack's Ruby provider sets no `RAILS_ENV`, so
  `bin/rails server` boots in development, where `config.hosts` is populated and
  `ActionDispatch::HostAuthorization` answers every request through the provided hostname with
  `403 Blocked hosts: <service>.up.nouva.cloud`. It is in `railpack.json` deploy variables.
- Ruby has no prebuilt binary in Railpack's mise setup, so the build compiles CRuby from source
  (including RDoc). On the 2 GB canary that alone took ~25 minutes before `bundle install` started.
  Expect a long first build; later builds hit the BuildKit cache.
- `phoenix` sets `PHX_SERVER=true` in `railpack.json`. Railpack builds a `mix release`, and a
  release only starts the endpoint when that variable is present (`config/runtime.exs`), so without
  it the container boots and serves nothing. `SECRET_KEY_BASE` stays a service variable because it
  is a per-deployment secret. Railpack does set `MIX_ENV=prod` itself.
- Elixir has the same source-build cost as Ruby, and worse: mise compiles Erlang/OTP from source
  too. Expect a very long first build on a small server.
- `phoenix` declares `elixir: "~> 1.17"` rather than the generated `"~> 1.14"`. Railpack resolves
  the constraint to its **lowest** satisfying version, so `~> 1.14` gave Elixir 1.14.5, and the
  transitive dependency `hpax` (via `bandit`) requires `~> 1.15`; `mix deps.compile` then died with
  `cannot use ^prefix outside of match clauses` in `lib/hpax/types.ex`. Keep the constraint at or
  above the highest any dependency needs.
- `phoenix` deliberately does **not** set `PHX_HOST`. Setting it to the service's own provided
  hostname makes every deployment fail with `Agent work result conflicts with protected environment
  material` — the control plane treats each environment-map value as a redaction token, and
  `PHX_HOST` then collides with `runtimeMetadata.ingressHost` in the deploy result
  (nouva-platform#187). The build succeeds and the container serves traffic on the server, but the
  deployment is marked Failed and no route is published. `PHX_HOST` only affects generated URLs, so
  the fixture leaves it at its `example.com` default; re-add it once #187 is fixed.
