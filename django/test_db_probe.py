import os
import unittest
from unittest.mock import patch

import django
import psycopg
from django.test import Client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


class DatabaseProbeTest(unittest.TestCase):
    def test_missing_database_returns_safe_failure_and_keeps_health(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            response = Client().get("/db-test")
            self.assertEqual(response.status_code, 503)
            self.assertEqual(
                response.json(),
                {"ok": False, "framework": "django", "error": "Database probe failed"},
            )
            self.assertTrue(Client().get("/healthz").json()["ok"])

    def test_unreachable_database_does_not_expose_credentials(self) -> None:
        with patch.dict(
            os.environ, {"DATABASE_URL": "postgresql://secret:password@127.0.0.1:1/missing"}
        ):
            response = Client().get("/db-test")
            self.assertEqual(response.status_code, 503)
            self.assertEqual(response.json()["error"], "Database probe failed")
            self.assertNotIn(b"password", response.content)

    def test_persists_increment_visible_to_another_connection(self) -> None:
        self.assertIn("DATABASE_URL", os.environ, "Run with a disposable PostgreSQL DATABASE_URL")
        first, second = Client().get("/db-test"), Client().get("/db-test")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        before, after = first.json(), second.json()
        self.assertEqual(
            after,
            {
                "ok": True,
                "framework": "django",
                "database": "postgresql",
                "counter": before["counter"] + 1,
            },
        )
        with psycopg.connect(os.environ["DATABASE_URL"]) as connection:
            row = connection.execute(
                "SELECT counter FROM nouva_deployment_probe WHERE fixture = %s", ("django",)
            ).fetchone()
            self.assertEqual(row, (after["counter"],))


if __name__ == "__main__":
    unittest.main()
