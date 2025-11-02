import { ScoreRecordModel } from '../models/score-record.js';
import { HttpError } from '../middleware/error-handler.js';

export interface SubmitScoreInput {
  userId: string;
  gameKey: string;
  score: number;
  level?: number;
  durationMs: number;
  mode: 'single' | 'multi';
  matchId?: string;
}

export async function submitScore(input: SubmitScoreInput) {
  if (!input.score || input.score < 0) {
    throw new HttpError(400, 'Score must be positive');
  }
  const record = await ScoreRecordModel.create({
    userId: input.userId,
    gameKey: input.gameKey,
    score: input.score,
    level: input.level,
    durationMs: input.durationMs,
    mode: input.mode,
    matchId: input.matchId,
  });
  return record;
}

export async function getLeaderboard(gameKey: string, limit = 10) {
  return ScoreRecordModel.find({ gameKey })
    .sort({ score: -1 })
    .limit(limit)
    .populate('userId', 'username');
}

export async function getUserHistory(userId: string, gameKey?: string) {
  const query = gameKey ? { userId, gameKey } : { userId };
  return ScoreRecordModel.find(query).sort({ createdAt: -1 });
}

interface HistoryQueryOptions {
  gameKey?: string;
  mode?: 'single' | 'multi';
  page: number;
  pageSize: number;
}

export async function getUserHistoryPaginated(userId: string, options: HistoryQueryOptions) {
  const { gameKey, mode, page, pageSize } = options;
  const query: Record<string, unknown> = { userId };
  if (gameKey) {
    query.gameKey = gameKey;
  }
  if (mode) {
    query.mode = mode;
  }
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    ScoreRecordModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    ScoreRecordModel.countDocuments(query),
  ]);
  return {
    items,
    total,
    page,
    pageSize,
  };
}
