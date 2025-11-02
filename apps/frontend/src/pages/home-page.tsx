import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchGames } from '../features/games/games-slice';
import { GameCard } from '../components/game-card';
import { ensureGamesRegistered } from '../games/registry';

export function HomePage() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.games);
  const { t } = useTranslation();

  ensureGamesRegistered();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchGames());
    }
  }, [status, dispatch]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-slate-50">{t('home.heading')}</h1>
      <p className="mt-2 text-slate-400">{t('home.subheading')}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((game) => (
          <GameCard key={game.key} game={game} />
        ))}
      </div>
    </div>
  );
}
