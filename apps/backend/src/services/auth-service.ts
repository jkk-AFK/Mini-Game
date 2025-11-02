import argon2 from 'argon2';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { HttpError } from '../middleware/error-handler.js';
import { UserModel } from '../models/user.js';
import { RefreshTokenModel } from '../models/refresh-token.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';

interface CredentialsInput {
  username: string;
  email: string;
  password: string;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiry(token: string) {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (decoded?.exp) {
    return new Date(decoded.exp * 1000);
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback;
}

async function persistRefreshToken(token: string, userId: string) {
  const tokenHash = hashToken(token);
  const expiresAt = getRefreshExpiry(token);
  await RefreshTokenModel.create({
    tokenHash,
    userId,
    expiresAt,
  });
  return tokenHash;
}

async function revokeRefreshTokenHash(tokenHash: string, userId: string, replacedBy?: string) {
  await RefreshTokenModel.findOneAndUpdate(
    { tokenHash, userId },
    { revokedAt: new Date(), replacedBy },
  );
}

export async function issueTokens(userId: string, roles: string[], previousTokenHash?: string) {
  const accessToken = signAccessToken(userId, roles);
  const refreshToken = signRefreshToken(userId);
  const newTokenHash = await persistRefreshToken(refreshToken, userId);
  if (previousTokenHash) {
    await revokeRefreshTokenHash(previousTokenHash, userId, newTokenHash);
  }
  return {
    accessToken,
    refreshToken,
  };
}

export async function registerUser(input: CredentialsInput) {
  const exists = await UserModel.findOne({
    $or: [{ email: input.email }, { username: input.username }],
  });
  if (exists) {
    throw new HttpError(409, 'User already exists');
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await UserModel.create({
    username: input.username,
    email: input.email,
    passwordHash,
    providers: [{ type: 'email', providerId: input.email }],
  });
  return issueTokens(user.id, user.roles);
}

export async function loginUser(email: string, password: string) {
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    throw new HttpError(401, 'Invalid credentials');
  }

  return issueTokens(user.id, user.roles);
}

export async function refreshToken(token: string) {
  const payload = verifyRefreshToken(token);
  const user = await UserModel.findById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'Invalid refresh token');
  }
  const tokenHash = hashToken(token);
  const record = await RefreshTokenModel.findOne({ tokenHash, userId: user.id });
  if (!record || record.revokedAt) {
    throw new HttpError(401, 'Refresh token revoked');
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new HttpError(401, 'Refresh token expired');
  }
  return issueTokens(user.id, user.roles, tokenHash);
}

export async function revokeRefreshToken(token: string, userId: string) {
  const payload = verifyRefreshToken(token);
  if (payload.sub !== userId) {
    throw new HttpError(403, 'Token does not belong to user');
  }
  const tokenHash = hashToken(token);
  await revokeRefreshTokenHash(tokenHash, userId);
}
