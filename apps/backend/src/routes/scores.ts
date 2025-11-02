import { Router } from 'express';
import { z } from 'zod';
import { ensureAuthenticated, AuthRequest } from '../middleware/auth.js';
import { getLeaderboard, submitScore } from '../services/score-service.js';

const submitSchema = z.object({
  gameKey: z.string(),
  score: z.number().nonnegative(),
  level: z.number().int().min(0).optional(),
  durationMs: z.number().int().nonnegative(),
  mode: z.enum(['single', 'multi']),
  matchId: z.string().optional(),
});

export const router = Router();

router.get('/leaderboard', async (req, res, next) => {
  try {
    const { gameKey } = req.query;
    if (typeof gameKey !== 'string') {
      return res.status(400).json({ message: 'gameKey is required' });
    }
    const leaderboard = await getLeaderboard(gameKey);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
});

router.post('/submit', ensureAuthenticated, async (req: AuthRequest, res, next) => {
  try {
    const payload = submitSchema.parse(req.body);
    const record = await submitScore({ ...payload, userId: req.user!.id });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});
