import { useState } from "react";
import { checkDatabase } from "./database-probe.js";

type DatabaseState =
  | { status: "idle" | "pending" }
  | { status: "success"; counter: number }
  | { status: "error"; message: string };

export default function App() {
  const [count, setCount] = useState(0);
  const [database, setDatabase] = useState<DatabaseState>({ status: "idle" });

  return (
    <main className="page">
      <div className="card">
        <span className="tag">Railpack static</span>
        <h1 id="probe-marker">RAILPACK_STATIC_LIVE</h1>
        <p>
          Vite build with no <code>start</code> script. Railpack serves this with Caddy on{" "}
          <code>{"{$PORT}"}</code>. Reaching this page means the agent's injected{" "}
          <code>PORT</code> matched the port it probed.
        </p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Count: {count}
        </button>
        <button
          type="button"
          disabled={database.status === "pending"}
          onClick={() => {
            setDatabase({ status: "pending" });
            void checkDatabase(import.meta.env.VITE_DB_PROBE_URL, fetch).then(
              (counter) => setDatabase({ status: "success", counter }),
              (error: unknown) => setDatabase({
                status: "error",
                message: error instanceof Error ? error.message : "Database probe failed",
              })
            );
          }}
        >
          {database.status === "pending" ? "Testing database..." : "Test PostgreSQL"}
        </button>
        <p id="database-result" role="status" aria-live="polite">
          {database.status === "success" ? `PostgreSQL connected. Persistent counter: ${database.counter}` : null}
          {database.status === "error" ? database.message : null}
        </p>
      </div>
    </main>
  );
}
