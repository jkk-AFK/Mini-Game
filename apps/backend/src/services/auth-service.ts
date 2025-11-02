import argon2 from 'argon2';
import { HttpError } from '../middleware/error-handler.js';
import { UserModel } from '../models/user.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';

interface CredentialsInput {
  username: string;
  email: string;
  password: string;
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

export function issueTokens(userId: string, roles: string[]) {
  return {
    accessToken: signAccessToken(userId, roles),
    refreshToken: signRefreshToken(userId),
  };
}

export async function refreshToken(token: string) {
  const payload = verifyRefreshToken(token);
  const user = await UserModel.findById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'Invalid refresh token');
  }
  return issueTokens(user.id, user.roles);
}
