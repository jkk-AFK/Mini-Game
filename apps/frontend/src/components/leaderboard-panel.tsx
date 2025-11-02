import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api-client';

interface Entry {
  _id: string;
  userId: { username: string };
  score: number;
  createdAt: string;
}

interface Props {
  gameKey: string;
}

export function LeaderboardPanel({ gameKey }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    api
      .get('/scores/leaderboard', { params: { gameKey } })
      .then((response) => setEntries(response.data))
      .catch(() => setEntries([]));
  }, [gameKey]);

  return (
    <div className="rounded border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        {t('leaderboard.title')}
      </h3>
      <ul className="mt-3 space-y-2 text-xs text-slate-300">
        {entries.length === 0 && <li className="text-slate-500">{t('leaderboard.empty')}</li>}
        {entries.map((entry, index) => (
          <li key={entry._id} className="flex items-center justify-between">
            <span>
              {index + 1}. {entry.userId?.username ?? 'Anonymous'}
            </span>
            <span className="font-mono text-sky-300">{entry.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
