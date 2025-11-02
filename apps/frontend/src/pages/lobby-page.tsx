import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ensureGamesRegistered, gamesList } from '../games/registry';
import { useAppSelector } from '../store/hooks';
import { useLobbySocket } from '../hooks/use-lobby-socket';

ensureGamesRegistered();

const GAME_MODES: Array<{ key: 'single' | 'multi'; label: string }> = [
  { key: 'multi', label: '多人对战' },
  { key: 'single', label: '单人练习（直接进入游戏）' },
];

export function LobbyPage() {
  const user = useAppSelector((state) => state.auth.user);
  const lobbyState = useAppSelector((state) => state.lobby);
  const { requestMatch, cancelQueue } = useLobbySocket();
  const [selectedGame, setSelectedGame] = useState('mario');
  const [selectedMode, setSelectedMode] = useState<'single' | 'multi'>('multi');

  const availableGames = useMemo(() => gamesList(), []);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleJoin = () => {
    if (selectedMode === 'single') {
      window.location.href = `/games/${selectedGame}`;
      return;
    }
    requestMatch(selectedGame, selectedMode);
  };

  const isQueueing = lobbyState.queueing && lobbyState.queueGameKey === selectedGame;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-100">实时大厅</h1>
        <p className="mt-2 text-sm text-slate-400">
          与其他在线玩家即时匹配，或直接跳转单人练习模式。
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">选择游戏</label>
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
            <label className="text-sm text-slate-300">匹配模式</label>
            <div className="mt-2 flex gap-2">
              {GAME_MODES.map((mode) => (
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
            {selectedMode === 'single' ? '进入单人模式' : isQueueing ? '等待匹配…' : '加入匹配'}
          </button>
          {selectedMode === 'multi' && lobbyState.queueing && (
            <button
              type="button"
              onClick={cancelQueue}
              className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
            >
              取消排队
            </button>
          )}
          <div className="text-xs text-slate-500">
            连接状态：{lobbyState.connected ? '已连接' : '连接中…'}
            {lobbyState.lastError && (
              <span className="ml-2 text-rose-400">{lobbyState.lastError}</span>
            )}
          </div>
        </div>
        {lobbyState.currentMatch && (
          <div className="mt-6 rounded border border-emerald-600 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p>
              匹配成功！房间编号：<span className="font-mono">{lobbyState.currentMatch._id}</span>
            </p>
            <p className="mt-2">
              对战游戏：
              {availableGames.find((game) => game.key === lobbyState.currentMatch?.gameKey)?.name ??
                '未知'}
            </p>
            <p className="mt-2">
              <Link
                to={`/games/${lobbyState.currentMatch.gameKey}`}
                className="font-semibold text-sky-300 underline hover:text-sky-200"
              >
                点击进入战斗
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
