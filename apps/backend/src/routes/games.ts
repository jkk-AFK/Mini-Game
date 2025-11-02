import { Router } from 'express';
import { ensureAuthenticated, AuthRequest } from '../middleware/auth.js';
import { GameModel } from '../models/game.js';
import { getUserHistory } from '../services/score-service.js';

export const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const games = await GameModel.find();
    res.json(games);
  } catch (error) {
    next(error);
  }
});

router.get('/:key/history', ensureAuthenticated, async (req: AuthRequest, res, next) => {
  try {
    const records = await getUserHistory(req.user!.id, req.params.key);
    res.json(records);
  } catch (error) {
    next(error);
  }
});
