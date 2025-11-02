import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ensureGamesRegistered } from '../games/registry';
import { gameRegistry } from '@game-engine/index';
import type { GameRuntime } from '@game-engine/index';
import { ControlBar } from '../components/control-bar';
import { LeaderboardPanel } from '../components/leaderboard-panel';
import api from '../utils/api-client';
import { useAppSelector } from '../store/hooks';
import { TicTacToeMultiplayer } from '../games/tictactoe/tic-tac-toe-multiplayer';

export function GamePage() {
  const { gameKey } = useParams<{ gameKey: string }>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const startTimeRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>('idle');
  const user = useAppSelector((state) => state.auth.user);
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');

  ensureGamesRegistered();
  const definition = gameKey ? gameRegistry.get(gameKey) : undefined;

  const submitScore = useCallback(
    async (finalScore: number) => {
      if (!definition || !user) return;
      const durationMs = Math.max(1, Math.round(performance.now() - startTimeRef.current));
      try {
        await api.post('/scores/submit', {
          gameKey: definition.key,
          score: finalScore,
          durationMs,
          mode: 'single',
        });
      } catch (error) {
        console.warn('Failed to submit score', error);
      }
    },
    [definition, user],
  );

  useEffect(() => {
    if (!definition || !canvasRef.current || matchId) return;
    const runtime = definition.createRuntime({
      canvas: canvasRef.current,
      onScoreUpdate: setScore,
      onGameOver: (finalScore) => {
        setScore(finalScore);
        setStatus('finished');
        submitScore(finalScore);
      },
    });
    runtimeRef.current = runtime;
    runtime.start();
    setStatus('running');
    startTimeRef.current = performance.now();
    return () => {
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [definition, submitScore, matchId]);

  if (!definition) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-slate-300">{t('game.notFound')}</div>
    );
  }

  const runtime = runtimeRef.current;

  if (matchId && definition.key === 'tic-tac-toe') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <TicTacToeMultiplayer matchId={matchId} />
          </div>
          <div className="w-full max-w-sm space-y-4">
            <div className="rounded border border-slate-800 bg-slate-900/80 p-4">
              <h2 className="text-lg font-semibold text-slate-100">{definition.name}</h2>
              <p className="mt-2 text-sm text-slate-400">{definition.description}</p>
            </div>
            <LeaderboardPanel gameKey={definition.key} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <canvas ref={canvasRef} className="w-full rounded border border-slate-800 bg-slate-950" />
        </div>
        <div className="w-full max-w-sm space-y-4">
          <div className="rounded border border-slate-800 bg-slate-900/80 p-4">
            <h2 className="text-lg font-semibold text-slate-100">{definition.name}</h2>
            <p className="mt-2 text-sm text-slate-400">{definition.description}</p>
            <p className="mt-4 text-sm text-slate-400">
              {t('game.score')}: <span className="font-mono text-sky-300">{score}</span>
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
              {t('game.status')}:{' '}
              {t(
                status === 'idle'
                  ? 'game.statusLabel.idle'
                  : status === 'running'
                  ? 'game.statusLabel.running'
                  : 'game.statusLabel.finished',
              )}
            </p>
          </div>
          <ControlBar
            onStart={() => {
              runtime?.resume();
              setStatus('running');
            }}
            onPause={() => {
              runtime?.pause();
              setStatus('idle');
            }}
            onReset={() => {
              runtime?.reset();
              setScore(0);
              setStatus('running');
              startTimeRef.current = performance.now();
            }}
            isRunning={status === 'running'}
          />
          <LeaderboardPanel gameKey={definition.key} />
          <div className="rounded border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-400">
            <p>{t('game.controls.title')}:</p>
            <ul className="mt-2 space-y-1">
              <li>{t('game.controls.move')}</li>
              <li>{t('game.controls.jump')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
