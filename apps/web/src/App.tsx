import { useEffect, useState } from "react";
import type { Participant } from "@sb/types";

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/participants")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setParticipants)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="app">
      <header className="header">
        <h1>SB 10sion Up</h1>
        <p>성북 SB 스타트업 네트워킹 해커톤</p>
      </header>

      {error && <p className="error">API 오류: {error}</p>}

      <ul className="list">
        {participants.map((p) => (
          <li key={p.id} className="card">
            <strong>{p.name}</strong>
            <span className="meta">
              {p.team} · {p.role}
            </span>
            <div className="tags">
              {p.interests.map((i) => (
                <span key={i} className="tag">
                  #{i}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
