import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getAccessTokenPayload } from '@/features/auth/session';
import { validateBookingTime } from '@/features/bookings/rules';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }

    const decoded = getAccessTokenPayload(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Sesión inválida o expirada. Inicia sesión nuevamente.' }, { status: 401 });
    }

    // Obtener las reservas del usuario autenticado incluyendo la información del espacio
    const bookings = await prisma.booking.findMany({
      where: { userId: decoded.userId },
      include: {
        space: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Devuelve siempre un status 200 con el arreglo (vacío [] o con reservas)
    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return NextResponse.json(
      { error: 'Error interno al consultar las reservas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const user = token ? getAccessTokenPayload(token) : null;

    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para reservar.' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'La solicitud no contiene JSON válido.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Datos de reserva inválidos.' }, { status: 400 });
    }

    const { spaceId, startTime, endTime } = body as Record<string, unknown>;
    if (typeof spaceId !== 'string' || typeof startTime !== 'string' || typeof endTime !== 'string') {
      return NextResponse.json({ error: 'Espacio, fecha y horas son obligatorios.' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      return NextResponse.json({ error: 'La fecha u hora de la reserva no es válida.' }, { status: 400 });
    }
    if (start <= now) {
      return NextResponse.json({ error: 'No puedes reservar en una fecha u hora que ya pasó.' }, { status: 400 });
    }
    if (end <= start) {
      return NextResponse.json({ error: 'La hora de finalización debe ser posterior a la de inicio.' }, { status: 400 });
    }

    const timeRuleViolation = validateBookingTime(start, end, now);
    if (timeRuleViolation) {
      const messages = {
        BOOKING_IN_PAST: 'No puedes reservar en una fecha u hora que ya pasó.',
        BOOKING_TOO_FAR_AHEAD: 'Solo puedes reservar con hasta 30 días de anticipación.',
        BOOKING_DURATION_INVALID: 'La reserva debe durar entre 1 y 4 horas.',
        BOOKING_NOT_FULL_HOURS: 'Las reservas deben usar horas completas, por ejemplo de 10:00 a 12:00.',
        BOOKING_OUTSIDE_SERVICE_HOURS: 'El horario de servicio es de 7:00 a 21:00 (hora de Colombia).',
      } satisfies Record<typeof timeRuleViolation, string>;
      return NextResponse.json({ error: messages[timeRuleViolation], code: timeRuleViolation }, { status: 400 });
    }

    const space = await prisma.space.findFirst({ where: { id: spaceId, isActive: true } });
    if (!space) {
      return NextResponse.json({ error: 'El espacio no existe o no está disponible.' }, { status: 404 });
    }

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        spaceId,
        status: 'CONFIRMED',
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true },
    });
    if (conflictingBooking) {
      return NextResponse.json({ error: 'El espacio ya está reservado en ese horario.' }, { status: 409 });
    }

    const userConflict = await prisma.booking.findFirst({
      where: {
        userId: user.userId,
        status: 'CONFIRMED',
        startTime: { lt: end },
        endTime: { gt: start },
      },
      select: { id: true },
    });
    if (userConflict) {
      return NextResponse.json({ error: 'Ya tienes otra reserva confirmada que se cruza con ese horario.' }, { status: 409 });
    }

    const nowFutureBookings = await prisma.booking.count({
      where: { userId: user.userId, status: 'CONFIRMED', startTime: { gte: now } },
    });
    if (nowFutureBookings >= 3) {
      return NextResponse.json({ error: 'Ya tienes el máximo de 3 reservas futuras confirmadas.' }, { status: 409 });
    }

    const durationHours = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        userId: user.userId,
        spaceId,
        startTime: start,
        endTime: end,
        totalPrice: durationHours * space.pricePerHour,
      },
      include: { space: true },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return NextResponse.json({ error: 'Error interno al crear la reserva.' }, { status: 500 });
  }
}
