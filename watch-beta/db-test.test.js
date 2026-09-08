import { expect, test } from "bun:test";
import { runDatabaseProbe } from "./db-test.js";

test("rejects a missing database URL", async () => {
  await expect(runDatabaseProbe(undefined, "test-watch-beta")).rejects.toThrow("DATABASE_URL is required");
});

test("rejects non-PostgreSQL URLs", async () => {
  await expect(runDatabaseProbe("https://example.com", "test-watch-beta")).rejects.toThrow("must use PostgreSQL");
});

test.skipIf(!process.env.TEST_DATABASE_URL)("persists a counter across independent connections", async () => {
  const first = await runDatabaseProbe(process.env.TEST_DATABASE_URL, "test-watch-beta");
  const second = await runDatabaseProbe(process.env.TEST_DATABASE_URL, "test-watch-beta");
  expect(first).toMatchObject({ ok: true, framework: "test-watch-beta", database: "postgresql" });
  expect(first.counter).toBeGreaterThan(0);
  expect(second.counter).toBe(first.counter + 1);
});
