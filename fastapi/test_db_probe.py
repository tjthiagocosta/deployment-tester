import json
import os
import unittest
from unittest.mock import patch

import psycopg
from main import db_test, healthz


class DatabaseProbeTest(unittest.TestCase):
    def test_missing_database_returns_safe_failure_and_keeps_health(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            response = db_test()
            self.assertEqual(response.status_code, 503)
            self.assertEqual(
                json.loads(bytes(response.body)),
                {"ok": False, "framework": "fastapi", "error": "Database probe failed"},
            )
            self.assertTrue(healthz()["ok"])

    def test_unreachable_database_does_not_expose_credentials(self) -> None:
        with patch.dict(
            os.environ, {"DATABASE_URL": "postgresql://secret:password@127.0.0.1:1/missing"}
        ):
            response = db_test()
            self.assertEqual(response.status_code, 503)
            self.assertEqual(json.loads(bytes(response.body))["error"], "Database probe failed")
            self.assertNotIn(b"password", response.body)

    def test_persists_increment_visible_to_another_connection(self) -> None:
        self.assertIn("DATABASE_URL", os.environ, "Run with a disposable PostgreSQL DATABASE_URL")
        first = db_test()
        second = db_test()
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        before, after = json.loads(bytes(first.body)), json.loads(bytes(second.body))
        self.assertEqual(
            after,
            {
                "ok": True,
                "framework": "fastapi",
                "database": "postgresql",
                "counter": before["counter"] + 1,
            },
        )
        with psycopg.connect(os.environ["DATABASE_URL"]) as connection:
            row = connection.execute(
                "SELECT counter FROM nouva_deployment_probe WHERE fixture = %s", ("fastapi",)
            ).fetchone()
            self.assertEqual(row, (after["counter"],))


if __name__ == "__main__":
    unittest.main()
