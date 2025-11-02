import jwt from 'jsonwebtoken';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET') {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function signAccessToken(subject: string, roles: string[]) {
  return jwt.sign({ roles }, requireSecret('JWT_SECRET'), {
    subject,
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(subject: string) {
  return jwt.sign({}, requireSecret('JWT_REFRESH_SECRET'), {
    subject,
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, requireSecret('JWT_REFRESH_SECRET')) as { sub: string };
}
