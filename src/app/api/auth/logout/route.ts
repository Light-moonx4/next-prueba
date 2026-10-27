import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getAccessTokenPayload } from '@/features/auth/session';
import { verifyRefreshToken } from '@/features/auth/tokens';

function clearAuthCookies(response: NextResponse) {
  response.cookies.set({
    name: 'accessToken', value: '', expires: new Date(0), maxAge: 0,
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
  });
  response.cookies.set({
    name: 'refreshToken', value: '', expires: new Date(0), maxAge: 0,
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
  });
}

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let userId: string | null = null;
  if (accessToken) userId = getAccessTokenPayload(accessToken)?.userId ?? null;
  if (!userId && refreshToken) userId = verifyRefreshToken(refreshToken)?.userId ?? null;

  try {
    // Revoca TODOS los refresh tokens del usuario. Así un logout no puede
    // ser deshecho automáticamente por un refresh token viejo.
    if (userId) {
      await prisma.refreshToken.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }
  } catch (error) {
    console.error('Error revocando refresh tokens:', error);
  }

  // Incluso si la BD falla, siempre eliminamos las cookies del navegador.
  const response = NextResponse.json({ message: 'Sesión cerrada correctamente' });
  clearAuthCookies(response);
  return response;
}
