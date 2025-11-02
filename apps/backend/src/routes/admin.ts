import { Router } from 'express';
import { z } from 'zod';
import { ensureAuthenticated, ensureRole, AuthRequest } from '../middleware/auth.js';
import { listUsers, banUser } from '../services/user-service.js';
import { getPlatformMetrics, listAuditLogs, recordAudit } from '../services/admin-service.js';

const banSchema = z.object({
  userId: z.string(),
  bannedUntil: z.string().datetime().optional(),
});

export const router = Router();

router.use(ensureAuthenticated, ensureRole('admin'));

router.get('/users', async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/metrics', async (_req, res, next) => {
  try {
    const metrics = await getPlatformMetrics();
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

router.get('/audits', async (_req, res, next) => {
  try {
    const logs = await listAuditLogs();
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.post('/ban', async (req: AuthRequest, res, next) => {
  try {
    const payload = banSchema.parse(req.body);
    const banned = await banUser(
      payload.userId,
      payload.bannedUntil ? new Date(payload.bannedUntil) : undefined,
    );
    await recordAudit(req.user!.id, 'ban-user', payload);
    res.json(banned);
  } catch (error) {
    next(error);
  }
});
