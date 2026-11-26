import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getAccessTokenPayload } from '@/features/auth/session';

export type AdminAuthorization =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string };

export async function authorizeAdmin(): Promise<AdminAuthorization> {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return { ok: false, status: 401, error: 'No autorizado' };

  const payload = getAccessTokenPayload(token);
  if (!payload) return { ok: false, status: 401, error: 'Sesión inválida o expirada' };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });
  if (!user) return { ok: false, status: 401, error: 'Usuario no encontrado' };
  if (user.role !== 'ADMIN') return { ok: false, status: 403, error: 'Se requiere rol de administrador' };

  return { ok: true, userId: user.id };
}
