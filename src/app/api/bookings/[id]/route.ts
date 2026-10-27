import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_change_me';

// GET: Obtener detalle de una reserva (Dueño o Admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let payload: jwt.JwtPayload & { role?: string; userId?: string };
    try {
      payload = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload & { role?: string; userId?: string };
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { space: true, user: { select: { email: true } } },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Regla 14: Un usuario no puede ver reservas de otro, incluso si cambia el id en la URL
    if (payload.role !== 'ADMIN' && booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH / DELETE: Cancelar reserva (Reglas 9, 10, 11)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let payload: jwt.JwtPayload & { role?: string; userId?: string };
    try {
      payload = jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload & { role?: string; userId?: string };
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    // Regla 9: Solo el dueño de la reserva o un administrador pueden cancelarla
    if (payload.role !== 'ADMIN' && booking.userId !== payload.userId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Regla 10: Un usuario puede cancelar su reserva hasta 2 horas antes de su inicio
    if (payload.role !== 'ADMIN') {
      const now = new Date();
      const startTime = new Date(booking.startTime);
      const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 2) {
        return NextResponse.json(
          { error: 'Solo se puede cancelar la reserva hasta 2 horas antes de su inicio' },
          { status: 400 }
        );
      }
    }

    // Regla 11: Cancelar cambia su estado a cancelada. El registro no se elimina.
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ message: 'Reserva cancelada con éxito', updatedBooking }, { status: 200 });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return NextResponse.json({ error: 'Error interno al cancelar la reserva' }, { status: 500 });
  }
}
