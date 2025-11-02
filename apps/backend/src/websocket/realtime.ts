import type { Server } from 'socket.io';
import { enqueueMatch, dequeueUser } from '../services/matchmaking-service.js';
import { submitScore } from '../services/score-service.js';

interface AuthContext {
  userId: string;
  username: string;
}

declare module 'socket.io' {
  interface Socket {
    authContext?: AuthContext;
  }
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

  io.of(/^\/ws\/game\/.+$/).on('connection', (socket) => {
    socket.on('player_state', (state) => {
      socket.broadcast.emit('player_state', state);
    });

    socket.on(
      'game_over',
      async (payload: { gameKey: string; score: number; durationMs: number }) => {
        await submitScore({
          userId: socket.authContext!.userId,
          gameKey: payload.gameKey,
          score: payload.score,
          durationMs: payload.durationMs,
          mode: 'multi',
        });
      },
    );
  });
}
