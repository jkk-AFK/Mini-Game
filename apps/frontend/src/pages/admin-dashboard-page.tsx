import { useEffect, useState } from 'react';
import api from '../utils/api-client';

interface Metrics {
  userCount: number;
  scoreCount: number;
  recentScores: Array<{ _id: string; gameKey: string; score: number; createdAt: string }>;
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.get('/admin/metrics').then((response) => setMetrics(response.data));
  }, []);

  if (!metrics) {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-slate-400">Loading metrics…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-100">Admin Dashboard</h1>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Users</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{metrics.userCount}</p>
        </div>
        <div className="rounded border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">Scores Logged</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{metrics.scoreCount}</p>
        </div>
      </div>
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-100">Recent Games</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {metrics.recentScores.map((score) => (
            <li key={score._id} className="rounded border border-slate-800 bg-slate-900/50 p-3">
              <span className="font-mono text-slate-200">{score.gameKey}</span> scored{' '}
              <span className="font-semibold text-sky-300">{score.score}</span> at{' '}
              {new Date(score.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
