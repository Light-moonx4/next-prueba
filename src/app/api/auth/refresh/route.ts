import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { signAccessToken, verifyRefreshToken } from '@/features/auth/tokens';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token no proporcionado' }, { status: 401 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json({ error: 'Refresh token inválido o expirado' }, { status: 401 });
    }

    const dbTokens = await prisma.refreshToken.findMany({
      where: { userId: payload.userId, revoked: false },
    });

    const validToken = await Promise.all(
      dbTokens.map(async (token) => (await bcrypt.compare(refreshToken, token.hashedToken)) ? token : null),
    );
    const validTokenRecord = validToken.find(Boolean);

    if (!validTokenRecord) {
      const response = NextResponse.json({ error: 'Refresh token revocado o no reconocido' }, { status: 401 });
      response.cookies.set({ name: 'accessToken', value: '', expires: new Date(0), maxAge: 0, path: '/' });
      response.cookies.set({ name: 'refreshToken', value: '', expires: new Date(0), maxAge: 0, path: '/' });
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    const newAccessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const response = NextResponse.json({ message: 'Token renovado con éxito', user });
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });
    return response;
  } catch (error) {
    console.error('Error en refresh token:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
