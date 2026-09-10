# redaction-probe

Checks that build-log redaction masks secrets without destroying ordinary build output.

Deploy as a **Dockerfile** app with build path `redaction-probe`, and set:

- `DATABASE_URL=${{<postgres service>.DATABASE_URL}}` — the reference is mandatory. Without at least
  one `${{...}}` reference the generated catalog never enters the build map and the probe proves
  nothing.
- `PROBE_SECRET=zzsecretvaluezz`

Then read the build log **in the dashboard** and assert:

| line | expected |
|---|---|
| `NOUVA_PROBE_KEEP: pip install -r requirements.txt` | intact — was `[REDACTED]ments.txt` |
| `... requires a newer runtime` / `2 packages required` | intact — `require` is `PGSSLMODE`'s value |
| `... PGSSLMODE and DATABASE_URL from the environment` | intact — names are no longer tokens |
| `NOUVA_PROBE_MASK: prefixzzsecretvaluezzsuffix` | `prefix[REDACTED]suffix` — customer values still match mid-word |

See nouva-platform#219 and #245.
