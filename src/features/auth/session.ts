import jwt from 'jsonwebtoken';

export type SessionUser = {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

type AccessTokenPayload = jwt.JwtPayload & {
  userId: string;
  email?: string;
  role: 'USER' | 'ADMIN';
};

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'access_secret_key_change_me';

export function getAccessTokenPayload(token: string): AccessTokenPayload | null {
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    if (typeof payload !== 'object' || !payload.userId || !payload.role) {
      return null;
    }
    if (payload.role !== 'USER' && payload.role !== 'ADMIN') {
      return null;
    }
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
}
