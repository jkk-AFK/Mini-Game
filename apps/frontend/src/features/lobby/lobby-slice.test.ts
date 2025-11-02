import { describe, expect, it } from 'vitest';
import lobbyReducer, {
  lobbyConnected,
  lobbyDisconnected,
  matchFound,
  queueStarted,
  queueCleared,
} from './lobby-slice';

const initialState = lobbyReducer(undefined, { type: '@@INIT' });

describe('lobby slice', () => {
  it('handles connection lifecycle', () => {
    const connected = lobbyReducer(initialState, lobbyConnected());
    expect(connected.connected).toBe(true);

    const disconnected = lobbyReducer(connected, lobbyDisconnected());
    expect(disconnected.connected).toBe(false);
    expect(disconnected.queueing).toBe(false);
  });

  it('handles queue state and match found', () => {
    const queued = lobbyReducer(initialState, queueStarted({ gameKey: 'tetris', mode: 'multi' }));
    expect(queued.queueing).toBe(true);
    expect(queued.queueGameKey).toBe('tetris');

    const matched = lobbyReducer(
      queued,
      matchFound({ _id: 'match-1', gameKey: 'tetris', status: 'waiting', players: [] }),
    );
    expect(matched.queueing).toBe(false);
    expect(matched.currentMatch?.gameKey).toBe('tetris');
  });

  it('clears queue explicitly', () => {
    const queued = lobbyReducer(initialState, queueStarted({ gameKey: 'snake', mode: 'multi' }));
    const cleared = lobbyReducer(queued, queueCleared());
    expect(cleared.queueing).toBe(false);
    expect(cleared.queueGameKey).toBeUndefined();
  });
});
