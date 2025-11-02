import { UserModel } from '../models/user.js';
import { HttpError } from '../middleware/error-handler.js';

export async function getProfile(userId: string) {
  const user = await UserModel.findById(userId).select('-passwordHash');
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}

export async function updateProfile(
  userId: string,
  patch: Partial<{ username: string; locale: string }>,
) {
  const updated = await UserModel.findByIdAndUpdate(userId, patch, { new: true }).select(
    '-passwordHash',
  );
  if (!updated) {
    throw new HttpError(404, 'User not found');
  }
  return updated;
}

export async function listUsers() {
  return UserModel.find().select('-passwordHash').sort({ createdAt: -1 });
}

export async function banUser(userId: string, bannedUntil?: Date) {
  const user = await UserModel.findByIdAndUpdate(userId, { bannedUntil }, { new: true });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user;
}
