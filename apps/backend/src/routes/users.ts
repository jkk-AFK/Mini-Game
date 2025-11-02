import { Router } from 'express';
import { z } from 'zod';
import { ensureAuthenticated, AuthRequest } from '../middleware/auth.js';
import { getProfile, updateProfile } from '../services/user-service.js';

const updateSchema = z.object({
  username: z.string().min(3).optional(),
  locale: z.string().min(2).optional(),
});

export const router = Router();

router.use(ensureAuthenticated);

router.get('/me', async (req: AuthRequest, res, next) => {
  try {
    const profile = await getProfile(req.user!.id);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.patch('/me', async (req: AuthRequest, res, next) => {
  try {
    const patch = updateSchema.parse(req.body);
    const profile = await updateProfile(req.user!.id, patch);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});
