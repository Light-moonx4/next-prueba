import { NextResponse, connection } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await params;

  const bookings = await prisma.booking.findMany({
    where: { spaceId: id, status: 'CONFIRMED', endTime: { gt: new Date() } },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json(bookings, { headers: { 'Cache-Control': 'no-store' } });
}
