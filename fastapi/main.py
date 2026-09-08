import os

import psycopg
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, JSONResponse

app = FastAPI()


@app.get("/", response_class=HTMLResponse)
def root() -> str:
    return '<h1 id="probe-marker">FASTAPI_LIVE</h1>'


@app.get("/healthz")
def healthz() -> dict:
    return {"ok": True, "framework": "fastapi", "port": os.environ.get("PORT")}


@app.get("/db-test")
def db_test() -> JSONResponse:
    try:
        database_url = os.environ["DATABASE_URL"]
        if not database_url.startswith(("postgres://", "postgresql://")):
            raise ValueError("A PostgreSQL URL is required")
        with psycopg.connect(database_url, connect_timeout=5) as connection:
            connection.execute("SET statement_timeout = '5s'")
            connection.execute(
                "CREATE TABLE IF NOT EXISTS nouva_deployment_probe "
                "(fixture TEXT PRIMARY KEY, counter INTEGER NOT NULL)"
            )
            connection.execute(
                "INSERT INTO nouva_deployment_probe (fixture, counter) VALUES (%s, 1) "
                "ON CONFLICT (fixture) DO UPDATE "
                "SET counter = nouva_deployment_probe.counter + 1",
                ("fastapi",),
            )
            connection.commit()
            row = connection.execute(
                "SELECT counter FROM nouva_deployment_probe WHERE fixture = %s",
                ("fastapi",),
            ).fetchone()
            if row is None:
                raise RuntimeError("Probe row was not persisted")
            return JSONResponse(
                {"ok": True, "framework": "fastapi", "database": "postgresql", "counter": row[0]}
            )
    except (KeyError, ValueError, RuntimeError, psycopg.Error):
        # Public deployment probes must never expose connection details.
        return JSONResponse(
            {"ok": False, "framework": "fastapi", "error": "Database probe failed"},
            status_code=503,
        )
