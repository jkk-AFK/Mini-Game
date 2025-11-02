import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api-client';
import { useAppSelector } from '../store/hooks';

interface Metrics {
  userCount: number;
  scoreCount: number;
  recentScores: Array<{ _id: string; gameKey: string; score: number; createdAt: string }>;
}

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  roles: string[];
  bannedUntil?: string;
}

interface AuditRecord {
  _id: string;
  action: string;
  actorId: string;
  createdAt: string;
  payload: Record<string, unknown>;
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.roles.includes('admin')) {
      return;
    }
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [metricsResponse, usersResponse, auditsResponse] = await Promise.all([
          api.get('/admin/metrics'),
          api.get('/admin/users'),
          api.get('/admin/audits'),
        ]);
        if (!mounted) return;
        setMetrics(metricsResponse.data);
        setUsers(usersResponse.data);
        setAudits(auditsResponse.data);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const refreshUsers = async () => {
    const response = await api.get('/admin/users');
    setUsers(response.data);
  };

  const handleBanToggle = async (targetUser: AdminUser) => {
    const payload =
      targetUser.bannedUntil && new Date(targetUser.bannedUntil).getTime() > Date.now()
        ? { userId: targetUser._id }
        : {
            userId: targetUser._id,
            bannedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
    await api.post('/admin/ban', payload);
    await refreshUsers();
  };

  if (!user?.roles.includes('admin')) {
    return <Navigate to="/" replace />;
  }

  if (loading || !metrics) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-slate-400">
        {t('admin.loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-slate-100">{t('admin.title')}</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">{t('admin.users')}</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{metrics.userCount}</p>
        </div>
        <div className="rounded border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-sm uppercase tracking-wide text-slate-400">{t('admin.scores')}</h2>
          <p className="mt-2 text-3xl font-semibold text-slate-50">{metrics.scoreCount}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">{t('admin.recent')}</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {metrics.recentScores.map((score) => (
            <li key={score._id} className="rounded border border-slate-800 bg-slate-900/50 p-3">
              <span className="font-mono text-slate-200">{score.gameKey}</span>{' '}
              <span className="text-slate-400">→</span>{' '}
              <span className="font-semibold text-sky-300">{score.score}</span>{' '}
              {new Date(score.createdAt).toLocaleString()}
            </li>
          ))}
          {metrics.recentScores.length === 0 && (
            <li className="text-slate-500">{t('profile.historyEmpty')}</li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">{t('admin.userList')}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/60 text-slate-400">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">{t('auth.username')}</th>
                <th className="px-3 py-2">{t('auth.email')}</th>
                <th className="px-3 py-2">{t('profile.roles')}</th>
                <th className="px-3 py-2">{t('admin.bannedUntil')}</th>
                <th className="px-3 py-2">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => {
                const isBanned =
                  !!entry.bannedUntil && new Date(entry.bannedUntil).getTime() > Date.now();
                return (
                  <tr key={entry._id} className="border-b border-slate-800/60">
                    <td className="px-3 py-2 font-mono text-slate-500">{entry._id}</td>
                    <td className="px-3 py-2 text-slate-100">{entry.username}</td>
                    <td className="px-3 py-2">{entry.email}</td>
                    <td className="px-3 py-2">{entry.roles.join(', ')}</td>
                    <td className="px-3 py-2">
                      {entry.bannedUntil ? new Date(entry.bannedUntil).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleBanToggle(entry)}
                        className={`rounded px-3 py-1 text-xs font-semibold ${
                          isBanned
                            ? 'border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10'
                            : 'border border-rose-500 text-rose-300 hover:bg-rose-500/10'
                        }`}
                      >
                        {isBanned ? t('admin.unban') : t('admin.ban')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-100">{t('admin.audits')}</h2>
        <ul className="mt-4 space-y-2 text-xs text-slate-400">
          {audits.length === 0 && <li>{t('admin.noAudits')}</li>}
          {audits.map((audit) => (
            <li key={audit._id} className="rounded border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-slate-200">{audit.action}</span>
                <span>{new Date(audit.createdAt).toLocaleString()}</span>
              </div>
              <div className="mt-2 font-mono text-[11px]">
                {JSON.stringify(audit.payload ?? {}, null, 0)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
