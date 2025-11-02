import { AuditLogModel } from '../models/audit-log.js';
import { ScoreRecordModel } from '../models/score-record.js';
import { UserModel } from '../models/user.js';

export async function getPlatformMetrics() {
  const [userCount, scoreCount] = await Promise.all([
    UserModel.countDocuments(),
    ScoreRecordModel.countDocuments(),
  ]);

  const recentScores = await ScoreRecordModel.find().sort({ createdAt: -1 }).limit(20);

  return {
    userCount,
    scoreCount,
    recentScores,
  };
}

export async function recordAudit(
  actorId: string,
  action: string,
  payload: Record<string, unknown>,
) {
  await AuditLogModel.create({ actorId, action, payload });
}

export async function listAuditLogs(limit = 50) {
  return AuditLogModel.find().sort({ createdAt: -1 }).limit(limit);
}
