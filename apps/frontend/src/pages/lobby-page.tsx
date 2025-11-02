import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ensureGamesRegistered, gamesList } from '../games/registry';
import { useAppSelector } from '../store/hooks';
import { useLobbySocket } from '../hooks/use-lobby-socket';

ensureGamesRegistered();

export function LobbyPage() {
  const user = useAppSelector((state) => state.auth.user);
  const lobbyState = useAppSelector((state) => state.lobby);
  const { requestMatch, cancelQueue } = useLobbySocket();
  const [selectedGame, setSelectedGame] = useState('mario');
  const [selectedMode, setSelectedMode] = useState<'single' | 'multi'>('multi');
  const [redirectedMatch, setRedirectedMatch] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const availableGames = useMemo(() => gamesList(), []);
  const gameModes = useMemo(
    () => [
      { key: 'multi' as const, label: t('lobby.mode.multi') },
      { key: 'single' as const, label: t('lobby.mode.single') },
    ],
    [t],
  );

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleJoin = () => {
    if (selectedMode === 'single') {
      navigate(`/games/${selectedGame}`);
      return;
    }
    requestMatch(selectedGame, selectedMode);
  };

  const isQueueing = lobbyState.queueing && lobbyState.queueGameKey === selectedGame;

  useEffect(() => {
    if (lobbyState.currentMatch && redirectedMatch !== lobbyState.currentMatch._id) {
      const { gameKey, _id } = lobbyState.currentMatch;
      navigate(`/games/${gameKey}?matchId=${_id}`);
      setRedirectedMatch(_id);
    }
  }, [lobbyState.currentMatch, navigate, redirectedMatch]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-100">{t('lobby.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('lobby.subtitle')}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">{t('lobby.selectGame')}</label>
            <select
              value={selectedGame}
              onChange={(event) => setSelectedGame(event.target.value)}
              className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              {availableGames.map((game) => (
                <option key={game.key} value={game.key}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300">{t('lobby.matchMode')}</label>
            <div className="mt-2 flex gap-2">
              {gameModes.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setSelectedMode(mode.key)}
                  className={`flex-1 rounded border px-3 py-2 text-sm font-semibold transition ${
                    selectedMode === mode.key
                      ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center">
          <button
            type="button"
            onClick={handleJoin}
            className="rounded bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-900"
            disabled={selectedMode === 'multi' && !lobbyState.connected}
          >
            {selectedMode === 'single'
              ? t('lobby.joinSolo')
              : isQueueing
              ? t('lobby.waiting')
              : t('lobby.join')}
          </button>
          {selectedMode === 'multi' && lobbyState.queueing && (
            <button
              type="button"
              onClick={cancelQueue}
              className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              {t('lobby.cancel')}
            </button>
          )}
          <div className="text-xs text-slate-500">
            {t('lobby.status')}：
            {lobbyState.connected ? t('lobby.connected') : t('lobby.connecting')}
            {lobbyState.lastError && (
              <span className="ml-2 text-rose-400">
                {t('lobby.error')}: {lobbyState.lastError}
              </span>
            )}
          </div>
        </div>
        {lobbyState.currentMatch && (
          <div className="mt-6 rounded border border-emerald-600 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p>
              {t('lobby.matchSuccess')}{' '}
              <span className="font-mono">{lobbyState.currentMatch._id}</span>
            </p>
            <p className="mt-2">
              {t('profile.historyColumns.game')}：
              {availableGames.find((game) => game.key === lobbyState.currentMatch?.gameKey)?.name ??
                lobbyState.currentMatch.gameKey}
            </p>
            <p className="mt-2">
              <Link
                to={`/games/${lobbyState.currentMatch.gameKey}?matchId=${lobbyState.currentMatch._id}`}
                className="font-semibold text-sky-300 underline hover:text-sky-200"
              >
                {t('lobby.enterBattle')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
