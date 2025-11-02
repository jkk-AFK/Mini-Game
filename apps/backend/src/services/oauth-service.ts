import crypto from 'node:crypto';
import argon2 from 'argon2';
import { UserModel } from '../models/user.js';
import { issueTokens } from './auth-service.js';

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24);
}

async function generateUniqueUsername(base: string) {
  let candidate = slugify(base) || `player-${crypto.randomBytes(3).toString('hex')}`;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await UserModel.findOne({ username: candidate });
    if (!existing) {
      return candidate;
    }
    candidate = `${candidate}-${suffix}`.slice(0, 28);
    suffix += 1;
  }
}

export async function upsertOAuthUser(
  provider: 'google' | 'facebook',
  providerId: string,
  email?: string,
  displayName?: string,
) {
  let user = await UserModel.findOne({
    'providers.providerId': providerId,
    'providers.type': provider,
  });

  if (!user && email) {
    user = await UserModel.findOne({ email });
  }

  if (!user) {
    const username = await generateUniqueUsername(displayName ?? `${provider}-${providerId}`);
    const safeEmail = email ?? `${providerId}@${provider}.oauth.local`;
    const passwordHash = await argon2.hash(crypto.randomBytes(32).toString('hex'));
    user = await UserModel.create({
      username,
      email: safeEmail,
      passwordHash,
      providers: [{ type: provider, providerId }],
      roles: ['user'],
    });
  } else {
    const exists = user.providers.some(
      (entry) => entry.type === provider && entry.providerId === providerId,
    );
    if (!exists) {
      user.providers.push({ type: provider, providerId });
      await user.save();
    }
  }

  return issueTokens(user.id, user.roles);
}
