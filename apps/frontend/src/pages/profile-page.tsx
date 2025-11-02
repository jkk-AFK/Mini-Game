import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProfile } from '../features/auth/auth-slice';
import { fetchGames } from '../features/games/games-slice';
import { LocaleSwitcher } from '../components/locale-switcher';
import api from '../utils/api-client';

interface HistoryItem {
  _id: string;
  gameKey: string;
  score: number;
  mode: 'single' | 'multi';
  createdAt: string;
}

const PAGE_SIZE = 10;

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const games = useAppSelector((state) => state.games.items);
  const gamesStatus = useAppSelector((state) => state.games.status);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [gameFilter, setGameFilter] = useState<'all' | string>('all');
  const [modeFilter, setModeFilter] = useState<'all' | 'single' | 'multi'>('all');

  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (gamesStatus === 'idle') {
      dispatch(fetchGames());
    }
  }, [gamesStatus, dispatch]);

  const loadHistory = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (!user) return;
      setLoadingHistory(true);
      try {
        const params: Record<string, unknown> = {
          page: pageToLoad,
          pageSize: PAGE_SIZE,
        };
        if (gameFilter !== 'all') {
          params.gameKey = gameFilter;
        }
        if (modeFilter !== 'all') {
          params.mode = modeFilter;
        }
        const response = await api.get('/scores/history', { params });
        const payload = response.data as {
          items: HistoryItem[];
          total: number;
          page: number;
          pageSize: number;
        };
        setHistory((prev) => (append ? [...prev, ...payload.items] : payload.items));
        setPage(payload.page);
        setHasMore(payload.page * payload.pageSize < payload.total);
      } finally {
        setLoadingHistory(false);
      }
    },
    [user, gameFilter, modeFilter],
  );

  useEffect(() => {
    if (user) {
      void loadHistory(1, false);
    }
  }, [user, gameFilter, modeFilter, loadHistory]);

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-slate-300">
        {t('profile.loading')}
      </div>
    );
  }

  const resolveGameName = (key: string) =>
    games.find((game) => game.key === key)?.name ?? key;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-100">
        {t('profile.welcome', { name: user.username })}
      </h1>
      <div className="mt-6 rounded border border-slate-800 bg-slate-900/70 p-6">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">{t('profile.email')}</dt>
            <dd className="text-slate-100">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">{t('profile.locale')}</dt>
            <dd className="text-slate-100">
              <LocaleSwitcher />
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">{t('profile.roles')}</dt>
            <dd className="text-slate-100">{user.roles.join(', ')}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 rounded border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{t('profile.historyTitle')}</h2>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <span>{t('profile.historyColumns.game')}</span>
              <select
                value={gameFilter}
                onChange={(event) =>
                  setGameFilter(event.target.value === 'all' ? 'all' : event.target.value)
                }
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
              >
                <option value="all">{t('profile.historyFilter.all')}</option>
                {games.map((game) => (
                  <option key={game.key} value={game.key}>
                    {game.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span>{t('profile.historyColumns.mode')}</span>
              <select
                value={modeFilter}
                onChange={(event) =>
                  setModeFilter(event.target.value as 'all' | 'single' | 'multi')
                }
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
              >
                <option value="all">{t('profile.historyFilter.all')}</option>
                <option value="single">{t('profile.historyFilter.single')}</option>
                <option value="multi">{t('profile.historyFilter.multi')}</option>
              </select>
            </label>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">{t('profile.historyEmpty')}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="px-3 py-2">{t('profile.historyColumns.game')}</th>
                  <th className="px-3 py-2">{t('profile.historyColumns.score')}</th>
                  <th className="px-3 py-2">{t('profile.historyColumns.mode')}</th>
                  <th className="px-3 py-2">{t('profile.historyColumns.time')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id} className="border-b border-slate-800/60">
                    <td className="px-3 py-2 font-medium text-slate-100">
                      {resolveGameName(item.gameKey)}
                    </td>
                    <td className="px-3 py-2 font-mono text-sky-300">{item.score}</td>
                    <td className="px-3 py-2 capitalize">
                      {item.mode === 'single'
                        ? t('profile.historyFilter.single')
                        : t('profile.historyFilter.multi')}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => loadHistory(page + 1, true)}
              disabled={loadingHistory}
              className="rounded border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('profile.loadMore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
