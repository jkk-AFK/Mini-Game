import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GameInfo } from '../features/games/games-slice';

interface Props {
  game: GameInfo;
}

export function GameCard({ game }: Props) {
  const { t } = useTranslation();
  const description =
    typeof game.metadata?.description === 'string' ? game.metadata.description : '';
  return (
    <Link
      to={`/games/${game.key}`}
      className="group flex flex-col rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm transition hover:border-sky-400 hover:bg-slate-900"
    >
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-slate-100 group-hover:text-sky-300">
          {game.name}
        </h3>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{game.genre}</p>
        {description && <p className="mt-3 text-sm text-slate-400">{description}</p>}
      </div>
      <div className="mt-4 text-right text-xs text-slate-400">{t('gameCard.play')}</div>
    </Link>
  );
}
