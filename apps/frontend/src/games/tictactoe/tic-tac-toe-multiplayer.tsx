import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

interface TicTacToeState {
  board: Array<Array<'X' | 'O' | null>>;
  current: 'X' | 'O';
  winner?: 'X' | 'O' | 'draw';
}

interface RoomUpdate {
  matchId: string;
  gameKey: string;
  symbol: 'X' | 'O' | 'spectator';
}

interface ChatMessage {
  from: string;
  message: string;
  at: number;
}

interface Props {
  matchId: string;
}

const INITIAL_STATE: TicTacToeState = {
  board: Array.from({ length: 3 }, () => Array(3).fill(null)),
  current: 'X',
};

export function TicTacToeMultiplayer({ matchId }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const [state, setState] = useState<TicTacToeState>(INITIAL_STATE);
  const [symbol, setSymbol] = useState<'X' | 'O' | 'spectator'>('spectator');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;
    const socket = io(`/ws/game/${matchId}`, {
      auth: {
        userId: user.id,
        username: user.username,
      },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room_update', (payload: RoomUpdate) => {
      setSymbol(payload.symbol);
    });

    socket.on('state_snapshot', (payload: TicTacToeState) => {
      setState(payload);
    });

    socket.on('room_error', (payload: { message: string }) => {
      setError(payload.message);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('game_over', (payload: { winner: 'X' | 'O' | 'draw' }) => {
      setState((prev) => ({ ...prev, winner: payload.winner }));
    });

    socket.on('chat_message', (payload: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-50), payload]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [matchId, user]);

  const broadcastMove = useCallback(
    (x: number, y: number) => {
      if (!socketRef.current) return;
      socketRef.current.emit('make_move', { x, y });
    },
    [],
  );

  const handleCellClick = (x: number, y: number) => {
    if (symbol === 'spectator') {
      return;
    }
    if (state.winner) {
      return;
    }
    if (state.current !== symbol) {
      return;
    }
    if (state.board[y][x]) {
      return;
    }
    broadcastMove(x, y);
  };

  const handleSendChat = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || !socketRef.current) return;
    socketRef.current.emit('chat_message', { message });
    setChatInput('');
  };

  const statusMessage = useMemo(() => {
    if (state.winner) {
      if (state.winner === 'draw') {
        return t('game.multiplayer.draw');
      }
      return t('game.multiplayer.winner', { symbol: state.winner });
    }
    if (symbol === 'spectator') {
      return t('game.multiplayer.spectator');
    }
    return state.current === symbol
      ? t('game.multiplayer.yourTurn')
      : t('game.multiplayer.opponentTurn');
  }, [state.winner, state.current, symbol, t]);

  return (
    <div className="space-y-4">
      <div className="rounded border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300">
            {t('game.multiplayer.yourSymbol')}:{' '}
            <span className="font-semibold text-sky-300">{symbol.toUpperCase()}</span>
          </p>
          <p className="text-xs text-slate-500">
            {connected ? t('lobby.connected') : t('lobby.connecting')}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {state.board.map((row, y) =>
            row.map((cell, x) => (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => handleCellClick(x, y)}
                className={`aspect-square rounded border border-slate-700 text-3xl font-bold transition ${
                  state.winner
                    ? 'cursor-default'
                    : symbol === 'spectator'
                    ? 'cursor-not-allowed opacity-80'
                    : 'hover:border-sky-400'
                }`}
              >
                {cell && (
                  <span className={cell === 'X' ? 'text-sky-300' : 'text-rose-300'}>{cell}</span>
                )}
              </button>
            )),
          )}
        </div>
        <p className="mt-4 text-sm text-slate-300">{statusMessage}</p>
        {error && (
          <div className="mt-3 rounded border border-rose-500 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {t('game.multiplayer.error', { message: error })}
          </div>
        )}
      </div>

      <form onSubmit={handleSendChat} className="flex gap-2">
        <input
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          placeholder={t('game.multiplayer.chatPlaceholder')}
          className="flex-1 rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100"
        />
        <button
          type="submit"
          className="rounded bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-900"
        >
          {t('game.multiplayer.send')}
        </button>
      </form>

      <div className="max-h-40 overflow-y-auto rounded border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
        {messages.length === 0 && <p className="text-slate-500">{t('game.multiplayer.noChat')}</p>}
        {messages.map((msg) => (
          <p key={msg.at + msg.message}>
            <span className="font-semibold text-sky-300">{msg.from}</span>: {msg.message}
          </p>
        ))}
      </div>

      <Link
        to="/lobby"
        className="inline-flex w-fit items-center justify-center rounded border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
      >
        {t('game.multiplayer.backToLobby')}
      </Link>
    </div>
  );
}
