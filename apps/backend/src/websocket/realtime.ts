import type { Server, Socket } from 'socket.io';
import { enqueueMatch, dequeueUser } from '../services/matchmaking-service.js';
import { submitScore } from '../services/score-service.js';
import { MatchSessionModel } from '../models/match-session.js';

interface AuthContext {
  userId: string;
  username: string;
}

interface TicTacToeState {
  board: Array<Array<'X' | 'O' | null>>;
  current: 'X' | 'O';
  winner?: 'X' | 'O' | 'draw';
}

interface TicTacToePlayerState {
  userId: string;
  symbol: 'X' | 'O';
  sockets: Set<string>;
}

interface TicTacToeRoom {
  matchId: string;
  gameKey: string;
  players: Map<string, TicTacToePlayerState>;
  state: TicTacToeState;
  startedAt?: number;
  finalized: boolean;
}

declare module 'socket.io' {
  interface Socket {
    authContext?: AuthContext;
  }
}

const ticTacToeRooms = new Map<string, TicTacToeRoom>();

function createInitialTicTacToeState(): TicTacToeState {
  return {
    board: Array.from({ length: 3 }, () => Array(3).fill(null)),
    current: 'X',
  };
}

function namespaceMatchId(namespace: string) {
  return namespace.replace('/ws/game/', '');
}

function checkTicTacToeWinner(board: TicTacToeState['board']): 'X' | 'O' | 'draw' | null {
  const lines: Array<Array<'X' | 'O' | null>> = [
    ...board,
    ...Array.from({ length: 3 }, (_, col) => board.map((row) => row[col])),
    board.map((_, idx) => board[idx][idx]),
    board.map((_, idx) => board[idx][2 - idx]),
  ];
  for (const line of lines) {
    if (line[0] && line.every((cell) => cell === line[0])) {
      return line[0];
    }
  }
  const hasEmpty = board.some((row) => row.some((cell) => cell === null));
  return hasEmpty ? null : 'draw';
}

async function ensureTicTacToeRoom(matchId: string): Promise<TicTacToeRoom | null> {
  const cached = ticTacToeRooms.get(matchId);
  if (cached) {
    return cached;
  }

  const session = await MatchSessionModel.findById(matchId);
  if (!session || session.gameKey !== 'tic-tac-toe') {
    return null;
  }

  const players = new Map<string, TicTacToePlayerState>();
  session.players.forEach((player, index) => {
    players.set(player.userId.toString(), {
      userId: player.userId.toString(),
      symbol: index === 0 ? 'X' : 'O',
      sockets: new Set<string>(),
    });
  });

  const room: TicTacToeRoom = {
    matchId,
    gameKey: session.gameKey,
    players,
    state: session.snapshot ? (JSON.parse(session.snapshot) as TicTacToeState) : createInitialTicTacToeState(),
    startedAt: session.status === 'active' || session.status === 'finished' ? session.updatedAt.getTime() : undefined,
    finalized: session.status === 'finished',
  };

  ticTacToeRooms.set(matchId, room);
  return room;
}

async function markMatchStatus(matchId: string, status: 'active' | 'finished', snapshot?: TicTacToeState) {
  const update: Record<string, unknown> = { status };
  if (snapshot) {
    update.snapshot = JSON.stringify(snapshot);
  }
  await MatchSessionModel.findByIdAndUpdate(matchId, update);
}

function registerGenericGameHandlers(socket: Socket) {
  socket.on('player_state', (state) => {
    socket.broadcast.emit('player_state', state);
  });

  socket.on(
    'game_over',
    async (payload: { gameKey: string; score: number; durationMs: number; mode?: 'single' | 'multi' }) => {
      await submitScore({
        userId: socket.authContext!.userId,
        gameKey: payload.gameKey,
        score: payload.score,
        durationMs: payload.durationMs,
        mode: payload.mode ?? 'multi',
      });
    },
  );
}

async function finalizeTicTacToe(socket: Socket, room: TicTacToeRoom, winner: 'X' | 'O' | 'draw') {
  if (room.finalized) {
    return;
  }
  room.finalized = true;
  room.state.winner = winner;
  const finishedAt = Date.now();
  const duration = room.startedAt ? Math.max(1, finishedAt - room.startedAt) : finishedAt;

  await Promise.all(
    Array.from(room.players.values()).map((player) =>
      submitScore({
        userId: player.userId,
        gameKey: room.gameKey,
        score: winner === 'draw' ? 0 : player.symbol === winner ? 1 : 0,
        durationMs: duration,
        mode: 'multi',
        matchId: room.matchId,
      }),
    ),
  );

  await markMatchStatus(room.matchId, 'finished', room.state);
  socket.nsp.emit('game_over', { winner, board: room.state.board });
}

export function createRealtimeServer(io: Server) {
  io.use((socket, next) => {
    const { userId, username } = socket.handshake.auth as Partial<AuthContext>;
    if (!userId) {
      return next(new Error('Missing userId'));
    }
    socket.authContext = { userId, username: username ?? 'Player' };
    next();
  });

  const lobby = io.of('/ws/lobby');
  lobby.on('connection', (socket) => {
    socket.on('match_request', async (payload: { gameKey: string; mode: 'single' | 'multi' }) => {
      try {
        const session = await enqueueMatch({
          userId: socket.authContext!.userId,
          gameKey: payload.gameKey,
          mode: payload.mode,
          requestedAt: Date.now(),
        });
        if (session) {
          lobby.emit('match_found', session);
        }
      } catch (error) {
        socket.emit('match_error', { message: 'Failed to join queue', details: error });
      }
    });

    socket.on('cancel_match', () => {
      dequeueUser(socket.authContext!.userId);
      socket.emit('queue_cancelled');
    });

    socket.on('disconnect', () => {
      dequeueUser(socket.authContext!.userId);
    });
  });

  io.of(/^\/ws\/game\/.+$/).on('connection', async (socket) => {
    const matchId = namespaceMatchId(socket.nsp.name);
    const room = await ensureTicTacToeRoom(matchId);

    if (!room) {
      registerGenericGameHandlers(socket);
      return;
    }

    const { userId } = socket.authContext!;
    const player = room.players.get(userId);

    if (player) {
      player.sockets.add(socket.id);
    }

    socket.on('join_room', async () => {
      if (player && !room.startedAt && Array.from(room.players.values()).every((entry) => entry.sockets.size > 0)) {
        room.startedAt = Date.now();
        room.state.current = 'X';
        room.state.winner = undefined;
        room.finalized = false;
        await markMatchStatus(room.matchId, 'active');
      }

      socket.emit('room_update', {
        matchId: room.matchId,
        gameKey: room.gameKey,
        symbol: player?.symbol ?? 'spectator',
        players: Array.from(room.players.values()).map((entry) => ({
          userId: entry.userId,
          symbol: entry.symbol,
        })),
      });
      socket.emit('state_snapshot', room.state);
      socket.broadcast.emit('room_update', {
        matchId: room.matchId,
        gameKey: room.gameKey,
        symbol: player?.symbol ?? 'spectator',
        players: Array.from(room.players.values()).map((entry) => ({
          userId: entry.userId,
          symbol: entry.symbol,
        })),
      });
    });

    socket.on('make_move', async (payload: { x: number; y: number }) => {
      if (!player) {
        socket.emit('room_error', { message: 'Spectators cannot play' });
        return;
      }
      if (room.finalized) {
        socket.emit('room_error', { message: 'Game already finished' });
        return;
      }
      if (!room.startedAt) {
        socket.emit('room_error', { message: 'Game not started yet' });
        return;
      }
      if (player.symbol !== room.state.current) {
        socket.emit('room_error', { message: 'Not your turn' });
        return;
      }
      const { x, y } = payload;
      if (x < 0 || x > 2 || y < 0 || y > 2 || room.state.board[y][x]) {
        socket.emit('room_error', { message: 'Invalid move' });
        return;
      }

      room.state.board[y][x] = player.symbol;
      const winner = checkTicTacToeWinner(room.state.board);
      if (winner) {
        room.state.winner = winner;
      } else {
        room.state.current = player.symbol === 'X' ? 'O' : 'X';
      }
      socket.nsp.emit('state_snapshot', room.state);

      if (winner) {
        await finalizeTicTacToe(socket, room, winner);
      }
    });

    socket.on('chat_message', (payload: { message: string }) => {
      const safeMessage = String(payload?.message ?? '').slice(0, 200);
      if (!safeMessage) return;
      socket.nsp.emit('chat_message', {
        from: socket.authContext?.username ?? 'Player',
        message: safeMessage,
        at: Date.now(),
      });
    });

    socket.on('disconnect', async () => {
      if (player) {
        player.sockets.delete(socket.id);
        const opponent = Array.from(room.players.values()).find((entry) => entry.userId !== player.userId);
        if (!room.finalized && room.startedAt && player.sockets.size === 0 && opponent) {
          await finalizeTicTacToe(socket, room, opponent.symbol);
        }
      }
      const allDisconnected = Array.from(room.players.values()).every((entry) => entry.sockets.size === 0);
      if (allDisconnected) {
        ticTacToeRooms.delete(room.matchId);
      }
    });
  });
}
