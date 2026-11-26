import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSpaceImageUrl } from '@/features/spaces/image';
import { authorizeAdmin } from '@/features/auth/admin';

// PUT: Editar espacio (Solo ADMIN)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await authorizeAdmin();
    if (!authorization.ok) return NextResponse.json({ error: authorization.error }, { status: authorization.status });

    const { id } = await params;
    const { name, nameEn, description, descriptionEn, pricePerHour, type, isActive, imageUrl } = await request.json();

    const parsedImage = imageUrl === undefined ? null : parseSpaceImageUrl(imageUrl);
    if (parsedImage && !parsedImage.valid) {
      return NextResponse.json({ error: 'La imagen debe ser una URL válida, una clave S3 válida o una imagen base64 de hasta 2 MB.' }, { status: 400 });
    }

    // Regla 13: Validar reservas futuras si se intenta desactivar el espacio
    if (isActive === false) {
      const futureBookings = await prisma.booking.count({
        where: {
          spaceId: id,
          status: 'CONFIRMED',
          startTime: { gte: new Date() },
        },
      });

      if (futureBookings > 0) {
        return NextResponse.json(
          { error: 'No se puede desactivar un espacio que tiene reservas futuras confirmadas' },
          { status: 409 }
        );
      }
    }

    const updatedSpace = await prisma.space.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(nameEn !== undefined && { nameEn: typeof nameEn === 'string' && nameEn.trim() ? nameEn.trim() : null }),
        ...(description !== undefined && { description }),
        ...(descriptionEn !== undefined && { descriptionEn: typeof descriptionEn === 'string' && descriptionEn.trim() ? descriptionEn.trim() : null }),
        ...(parsedImage && { imageUrl: parsedImage.imageUrl }),
        ...(pricePerHour !== undefined && { pricePerHour: Number(pricePerHour) }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updatedSpace, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar espacio:', error);
    return NextResponse.json({ error: 'Error interno al actualizar el espacio' }, { status: 500 });
  }
}

// PATCH / DELETE: Desactivar espacio (Regla 12: No se elimina, se desactiva)[cite: 4]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await authorizeAdmin();
    if (!authorization.ok) return NextResponse.json({ error: authorization.error }, { status: authorization.status });

    const { id } = await params;

    // Verificar reservas futuras antes de desactivar (Regla 13)[cite: 4]
    const futureBookings = await prisma.booking.count({
      where: {
        spaceId: id,
        status: 'CONFIRMED',
        startTime: { gte: new Date() },
      },
    });

    if (futureBookings > 0) {
      return NextResponse.json(
        { error: 'No se puede desactivar un espacio con reservas futuras confirmadas' },
        { status: 409 }
      );
    }

    const deactivatedSpace = await prisma.space.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Espacio desactivado con éxito', deactivatedSpace }, { status: 200 });
  } catch (error) {
    console.error('Error al desactivar espacio:', error);
    return NextResponse.json({ error: 'Error interno al desactivar el espacio' }, { status: 500 });
  }
}
