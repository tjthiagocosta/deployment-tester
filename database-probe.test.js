import { expect, test } from "bun:test";
import { checkDatabase } from "./src/database-probe.ts";

test("reads the counter from a successful PostgreSQL probe", async () => {
  const requests = [];
  const counter = await checkDatabase("https://probe.example/db-test", async (...args) => {
    requests.push(args);
    return Response.json({ ok: true, database: "postgresql", counter: 4 });
  });
  expect(counter).toBe(4);
  expect(requests[0][1]).toEqual({ cache: "no-store", credentials: "omit" });
});

test("requires a configured companion URL", async () => {
  await expect(checkDatabase(undefined, fetch)).rejects.toThrow("VITE_DB_PROBE_URL");
});

test("rejects a success marker without a persisted counter", async () => {
  await expect(checkDatabase("/db-test", async () => Response.json({ ok: true })))
    .rejects.toThrow("Database probe failed");
});

test("does not expose API error details", async () => {
  await expect(checkDatabase("/db-test", async () => Response.json({ error: "private connection details" }, { status: 503 })))
    .rejects.toThrow("Database probe failed. Check the companion API configuration.");
});
