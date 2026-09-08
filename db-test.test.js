import { expect, test } from "bun:test";
import { runDatabaseProbe } from "./db-test.js";

test("rejects a missing database URL", async () => {
  await expect(runDatabaseProbe(undefined, "test-vite-node")).rejects.toThrow("DATABASE_URL is required");
});

test("rejects non-PostgreSQL URLs", async () => {
  await expect(runDatabaseProbe("https://example.com", "test-vite-node")).rejects.toThrow("must use PostgreSQL");
});

test.skipIf(!process.env.TEST_DATABASE_URL)("persists a counter across independent connections", async () => {
  const first = await runDatabaseProbe(process.env.TEST_DATABASE_URL, "test-vite-node");
  const second = await runDatabaseProbe(process.env.TEST_DATABASE_URL, "test-vite-node");
  expect(first).toMatchObject({ ok: true, framework: "test-vite-node", database: "postgresql" });
  expect(first.counter).toBeGreaterThan(0);
  expect(second.counter).toBe(first.counter + 1);
});
