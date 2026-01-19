import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="page">
      <div className="card">
        <span className="tag">Bun + React</span>
        <h1>Deployment Tester</h1>
        <p>Simple counter to validate builds and deploys.</p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          Count: {count}
        </button>
      </div>
    </main>
  );
}
