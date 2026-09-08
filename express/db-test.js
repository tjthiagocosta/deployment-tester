import pg from "pg";

/**
 * @param {string | undefined} databaseUrl
 * @param {string} fixture
 * @returns {Promise<{ok: true, framework: string, database: "postgresql", counter: number}>}
 */
export async function runDatabaseProbe(databaseUrl, fixture) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const protocol = new URL(databaseUrl).protocol;
  if (protocol !== "postgres:" && protocol !== "postgresql:") {
    throw new Error("DATABASE_URL must use PostgreSQL");
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });
  try {
    await client.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS nouva_deployment_probe (
      fixture TEXT PRIMARY KEY,
      counter INTEGER NOT NULL
    )`);
    await client.query(
      `INSERT INTO nouva_deployment_probe (fixture, counter) VALUES ($1, 1)
       ON CONFLICT (fixture) DO UPDATE
       SET counter = nouva_deployment_probe.counter + 1`,
      [fixture]
    );
    // A separate read verifies the committed write, including after a redeployment.
    const result = await client.query(
      "SELECT counter FROM nouva_deployment_probe WHERE fixture = $1",
      [fixture]
    );
    const counter = result.rows[0]?.counter;
    if (!Number.isSafeInteger(counter) || counter < 1) {
      throw new Error("Database returned an invalid counter");
    }
    return { ok: true, framework: fixture, database: "postgresql", counter };
  } finally {
    await client.end();
  }
}
