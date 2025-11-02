import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const findMock = vi.fn();
  const sortMock = vi.fn();
  const skipMock = vi.fn();
  const limitMock = vi.fn();
  const countMock = vi.fn();
  return { findMock, sortMock, skipMock, limitMock, countMock };
});

vi.mock('../src/models/score-record.js', () => ({
  ScoreRecordModel: {
    find: mocks.findMock,
    countDocuments: mocks.countMock,
  },
}));

import { getUserHistoryPaginated } from '../src/services/score-service.js';

beforeEach(() => {
  const { findMock, sortMock, skipMock, limitMock, countMock } = mocks;

  findMock.mockReset();
  sortMock.mockReset();
  skipMock.mockReset();
  limitMock.mockReset();
  countMock.mockReset();

  sortMock.mockReturnValue({ skip: skipMock });
  skipMock.mockReturnValue({ limit: limitMock });
  limitMock.mockResolvedValue([
    {
      _id: 'score-1',
      userId: 'user-1',
      gameKey: 'tetris',
      score: 420,
      mode: 'single',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    },
  ]);

  findMock.mockReturnValue({ sort: sortMock });
  countMock.mockResolvedValue(5);
});

describe('getUserHistoryPaginated', () => {
  it('builds paginated response with filters', async () => {
    const result = await getUserHistoryPaginated('user-1', {
      gameKey: 'tetris',
      mode: 'single',
      page: 2,
      pageSize: 1,
    });

    const { findMock, sortMock, skipMock, limitMock, countMock } = mocks;

    expect(findMock).toHaveBeenCalledWith({ userId: 'user-1', gameKey: 'tetris', mode: 'single' });
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
    expect(skipMock).toHaveBeenCalledWith(1);
    expect(limitMock).toHaveBeenCalledWith(1);
    expect(countMock).toHaveBeenCalledWith({ userId: 'user-1', gameKey: 'tetris', mode: 'single' });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(5);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(1);
  });
});
