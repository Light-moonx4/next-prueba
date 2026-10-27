import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'access_secret_key_change_me';

type AccessPayload = jwt.JwtPayload & { userId: string; role: 'USER' | 'ADMIN' };

function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    if (typeof payload !== 'object' || !payload.userId || !payload.role) return null;
    if (payload.role !== 'USER' && payload.role !== 'ADMIN') return null;
    return payload as AccessPayload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const accessToken = request.cookies.get('accessToken')?.value;

  const isPrivate = path.startsWith('/private') || path.startsWith('/dashboard');
  const isAdmin = path.startsWith('/admin');

  if (!isPrivate && !isAdmin) return NextResponse.next();

  const payload = accessToken ? verifyAccessToken(accessToken) : null;

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/private/:path*', '/dashboard/:path*', '/admin/:path*'],
};
