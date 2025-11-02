import { describe, expect, it, vi, beforeEach } from 'vitest';

const createMock = vi.hoisted(() =>
  vi.fn(async (payload) => ({
    toObject: () => ({
      _id: { toString: () => 'match-1' },
      gameKey: payload.gameKey,
      status: payload.status,
      players: payload.players.map((player: { userId: string; team: number }) => ({
        userId: { toString: () => player.userId },
        team: player.team,
      })),
    }),
  })),
);

vi.mock('../src/models/match-session.js', () => ({
  MatchSessionModel: {
    create: createMock,
  },
}));

import { enqueueMatch, resetQueue } from '../src/services/matchmaking-service.js';

beforeEach(() => {
  createMock.mockClear();
  resetQueue();
});

describe('matchmaking service', () => {
  it('returns null when queue not satisfied', async () => {
    const result = await enqueueMatch({ userId: 'user-1', gameKey: 'snake', mode: 'multi', requestedAt: Date.now() });
    expect(result).toBeNull();
  });

  it('creates match when there are two players', async () => {
    await enqueueMatch({ userId: 'user-1', gameKey: 'snake', mode: 'multi', requestedAt: Date.now() });
    const result = await enqueueMatch({ userId: 'user-2', gameKey: 'snake', mode: 'multi', requestedAt: Date.now() });

    expect(createMock).toHaveBeenCalledOnce();
    expect(result).not.toBeNull();
    expect(result?._id).toBe('match-1');
    expect(result?.players[0]).toEqual({ userId: 'user-1', team: 0 });
    expect(result?.players[1]).toEqual({ userId: 'user-2', team: 1 });
  });
});
