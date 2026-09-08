import os

import psycopg
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.urls import path
from django.views.decorators.http import require_GET


def root(_request):
    return HttpResponse('<h1 id="probe-marker">DJANGO_LIVE</h1>')


def healthz(_request):
    return JsonResponse({"ok": True, "framework": "django", "port": os.environ.get("PORT")})


@require_GET
def db_test(_request: HttpRequest) -> JsonResponse:
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
                ("django",),
            )
            connection.commit()
            row = connection.execute(
                "SELECT counter FROM nouva_deployment_probe WHERE fixture = %s",
                ("django",),
            ).fetchone()
            if row is None:
                raise RuntimeError("Probe row was not persisted")
            return JsonResponse(
                {"ok": True, "framework": "django", "database": "postgresql", "counter": row[0]}
            )
    except (KeyError, ValueError, RuntimeError, psycopg.Error):
        # Public deployment probes must never expose connection details.
        return JsonResponse(
            {"ok": False, "framework": "django", "error": "Database probe failed"},
            status=503,
        )


urlpatterns = [path("", root), path("healthz", healthz), path("db-test", db_test)]
