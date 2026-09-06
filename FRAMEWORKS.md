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
| `laravel`        | PHP        | Laravel 12      | `LARAVEL_LIVE`      | `APP_KEY`                  |
| `rails`          | Ruby       | Rails 8 (API)   | `RAILS_LIVE`        | `SECRET_KEY_BASE`          |
| `phoenix`        | Elixir     | Phoenix 1.7     | `PHOENIX_LIVE`      | `SECRET_KEY_BASE`, `PHX_HOST` |
| `railpack-static`| TypeScript | Vite (static)   | `RAILPACK_STATIC_LIVE` | –                       |

## Generating the required secrets

- `APP_KEY` — `base64:$(openssl rand -base64 32)`
- `SECRET_KEY_BASE` — `openssl rand -hex 64`
- `PHX_HOST` — the service's provided hostname, e.g. `phoenix.up.nouva.cloud`

## Notes

- `railpack-static` is deliberately **start-script-free** so Railpack picks its static provider.
  It is the regression fixture for nouva-platform#152 and must deploy with no `PORT` variable set.
- `rails` has `kamal` and `thruster` removed from the Gemfile: they are deploy tooling that a
  Nouva user would not keep, and they make `bundle install` noticeably slower on a small server.
- `axum` pins `opt-level = 1` / `codegen-units = 16` in its release profile so the build fits in
  a 2 GB server.
