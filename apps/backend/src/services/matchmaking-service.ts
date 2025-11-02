import { MatchSessionModel } from '../models/match-session.js';

interface QueueEntry {
  userId: string;
  gameKey: string;
  mode: 'single' | 'multi';
  requestedAt: number;
}

const queue: QueueEntry[] = [];

export async function enqueueMatch(entry: QueueEntry) {
  queue.push(entry);
  return tryMatch(entry.gameKey);
}

async function tryMatch(gameKey: string) {
  const candidates = queue.filter((item) => item.gameKey === gameKey);
  if (candidates.length < 2) {
    return null;
  }
  const selected = candidates.slice(0, 2);
  selected.forEach((item) => {
    const index = queue.indexOf(item);
    if (index >= 0) {
      queue.splice(index, 1);
    }
  });
  return createMatchSession(
    gameKey,
    selected.map((item, index) => ({ userId: item.userId, team: index })),
  );
}

async function createMatchSession(gameKey: string, players: { userId: string; team: number }[]) {
  const session = await MatchSessionModel.create({
    gameKey,
    status: 'waiting',
    players,
  });
  const raw = session.toObject({ versionKey: false });
  return {
    ...raw,
    _id: raw._id.toString(),
    players: raw.players.map((player: { userId: unknown; team: number }) => ({
      userId: player.userId?.toString() ?? '',
      team: player.team,
    })),
  };
}

export function dequeueUser(userId: string) {
  const index = queue.findIndex((entry) => entry.userId === userId);
  if (index >= 0) {
    queue.splice(index, 1);
  }
}

export function queueSize(gameKey: string) {
  return queue.filter((entry) => entry.gameKey === gameKey).length;
}

export function resetQueue() {
  queue.length = 0;
}
