import { useTranslation } from 'react-i18next';

interface Props {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export function ControlBar({ onStart, onPause, onReset, isRunning }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900/80 p-3">
      <button
        type="button"
        onClick={onStart}
        className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        {isRunning ? t('controlBar.resume') : t('controlBar.start')}
      </button>
      <button
        type="button"
        onClick={onPause}
        className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        {t('controlBar.pause')}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        {t('controlBar.restart')}
      </button>
    </div>
  );
}
