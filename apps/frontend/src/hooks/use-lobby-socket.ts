import { useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  lobbyConnected,
  lobbyDisconnected,
  lobbyError,
  matchFound,
  queueCleared,
  queueStarted,
} from '../features/lobby/lobby-slice';

interface LobbyEvents {
  requestMatch(gameKey: string, mode: 'single' | 'multi'): void;
  cancelQueue(): void;
}

export function useLobbySocket(): LobbyEvents {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = io('/ws/lobby', {
      auth: {
        userId: user.id,
        username: user.username,
      },
    });

    socket.on('connect', () => {
      dispatch(lobbyConnected());
    });

    socket.on('disconnect', () => {
      dispatch(lobbyDisconnected());
    });

    socket.on('connect_error', (error) => {
      dispatch(lobbyError(error.message));
    });

    socket.on('match_found', (session) => {
      const isParticipant = session.players?.some(
        (player: { userId: string }) => player.userId === user.id,
      );
      if (isParticipant) {
        dispatch(matchFound(session));
      }
    });

    socket.on('match_error', (payload: { message: string }) => {
      dispatch(lobbyError(payload?.message ?? '匹配失败'));
      dispatch(queueCleared());
    });

    socket.on('queue_cancelled', () => {
      dispatch(queueCleared());
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      dispatch(lobbyDisconnected());
    };
  }, [dispatch, user]);

  const requestMatch = useCallback(
    (gameKey: string, mode: 'single' | 'multi') => {
      if (!socketRef.current) {
        dispatch(lobbyError('Lobby 连接尚未建立'));
        return;
      }
      dispatch(queueStarted({ gameKey, mode }));
      socketRef.current.emit('match_request', { gameKey, mode });
    },
    [dispatch],
  );

  const cancelQueue = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('cancel_match');
    }
    dispatch(queueCleared());
  }, [dispatch]);

  return { requestMatch, cancelQueue };
}
