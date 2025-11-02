interface Props {
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
}

export function ControlBar({ onStart, onPause, onReset, isRunning }: Props) {
  return (
    <div className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900/80 p-3">
      <button
        type="button"
        onClick={onStart}
        className="rounded bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        {isRunning ? 'Resume' : 'Start'}
      </button>
      <button
        type="button"
        onClick={onPause}
        className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        Pause
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-900"
      >
        Restart
      </button>
    </div>
  );
}
