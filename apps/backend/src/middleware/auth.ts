import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from './error-handler.js';
import { UserDocument, UserModel } from '../models/user.js';

export interface AuthRequest extends Request {
  user?: UserDocument;
}

function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET missing');
  }
  return jwt.verify(token, secret) as { sub: string; roles: string[] };
}

export async function ensureAuthenticated(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing authorization header'));
  }
  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyToken(token);
    const user = await UserModel.findById(payload.sub);
    if (!user) {
      return next(new HttpError(401, 'User not found'));
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(new HttpError(401, 'Invalid token', error));
  }
}

export function ensureRole(role: string) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user?.roles.includes(role)) {
      return next(new HttpError(403, 'Forbidden'));
    }
    return next();
  };
}
