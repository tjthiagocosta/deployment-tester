import { expect, test } from "bun:test";
import { runDatabaseProbe } from "./db-test.js";

test("rejects a missing database URL", async () => {
  await expect(runDatabaseProbe(undefined, "test-watch-alpha")).rejects.toThrow("DATABASE_URL is required");
});

test("rejects non-PostgreSQL URLs", async () => {
  await expect(runDatabaseProbe("https://example.com", "test-watch-alpha")).rejects.toThrow("must use PostgreSQL");
});

test.skipIf(!process.env.TEST_DATABASE_URL)("persists a counter across independent connections", async () => {
  const first = await runDatabaseProbe(process.env.TEST_DATABASE_URL, "test-watch-alpha");
  const second = await runDatabaseProbe(process.env.TEST_DATABASE_URL, "test-watch-alpha");
  expect(first).toMatchObject({ ok: true, framework: "test-watch-alpha", database: "postgresql" });
  expect(first.counter).toBeGreaterThan(0);
  expect(second.counter).toBe(first.counter + 1);
});


test("rejects TLS modes that allow a plaintext fallback", async () => {
  await expect(runDatabaseProbe("postgresql://localhost/fixture?sslmode=prefer", "test-mode"))
    .rejects.toThrow("Unsupported PostgreSQL TLS mode");
});

test.skipIf(!process.env.TEST_PLAINTEXT_DATABASE_URL)("requires TLS by default against the plaintext-only local test database", async () => {
  const databaseUrl = new URL(process.env.TEST_PLAINTEXT_DATABASE_URL);
  databaseUrl.searchParams.delete("sslmode");
  await expect(runDatabaseProbe(databaseUrl.toString(), "test-tls-required"))
    .rejects.toThrow("The server does not support SSL connections");
});
