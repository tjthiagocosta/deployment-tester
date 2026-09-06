import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="page">
      <div className="card">
        <span className="tag">Railpack static</span>
        <h1 id="probe-marker">RAILPACK_STATIC_LIVE</h1>
        <p>
          Vite build with no <code>start</code> script — Railpack serves this with Caddy on{" "}
          <code>{"{$PORT}"}</code>. Reaching this page means the agent's injected{" "}
          <code>PORT</code> matched the port it probed.
        </p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Count: {count}
        </button>
      </div>
    </main>
  );
}
