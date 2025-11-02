import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchGames } from '../features/games/games-slice';
import { GameCard } from '../components/game-card';
import { ensureGamesRegistered } from '../games/registry';

export function HomePage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.games);

  ensureGamesRegistered();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchGames());
    }
  }, [status, dispatch]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-50">Choose your game</h1>
      <p className="mt-2 text-slate-400">
        Classic arcade titles with modern multiplayer capabilities.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((game) => (
          <GameCard key={game.key} game={game} />
        ))}
      </div>
    </div>
  );
}
