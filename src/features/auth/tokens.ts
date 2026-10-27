import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'access_secret_key_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.REFRESH_SECRET ?? 'refresh_secret_key_change_me';

export function signAccessToken(payload: { userId: string; email: string; role: 'USER' | 'ADMIN' }) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: { userId: string }) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, REFRESH_SECRET);
    if (typeof payload !== 'object' || !payload.userId) return null;
    return { userId: String(payload.userId) };
  } catch {
    return null;
  }
}
