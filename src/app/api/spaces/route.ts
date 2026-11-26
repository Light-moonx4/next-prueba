import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseSpaceImageUrl } from '@/features/spaces/image';
import { authorizeAdmin } from '@/features/auth/admin';

// GET: Catálogo público (solo espacios activos)
export async function GET() {
  try {
    const spaces = await prisma.space.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(spaces, { status: 200 });
  } catch (error) {
    console.error('Error al listar espacios:', error);
    return NextResponse.json({ error: 'Error interno al obtener espacios' }, { status: 500 });
  }
}

// POST: Crear espacio (Solo ADMIN)
export async function POST(request: Request) {
  try {
    const authorization = await authorizeAdmin();
    if (!authorization.ok) return NextResponse.json({ error: authorization.error }, { status: authorization.status });

    const { name, nameEn, description, descriptionEn, pricePerHour, type, imageUrl } = await request.json();

    const parsedImage = parseSpaceImageUrl(imageUrl);
    if (!parsedImage.valid) {
      return NextResponse.json({ error: 'La imagen debe ser una URL válida, una clave S3 válida o una imagen base64 de hasta 2 MB.' }, { status: 400 });
    }

    if (!name || pricePerHour === undefined || !type) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (name, pricePerHour, type)' }, { status: 400 });
    }

    const newSpace = await prisma.space.create({
      data: {
        name,
        nameEn: typeof nameEn === 'string' && nameEn.trim() ? nameEn.trim() : null,
        description,
        descriptionEn: typeof descriptionEn === 'string' && descriptionEn.trim() ? descriptionEn.trim() : null,
        imageUrl: parsedImage.imageUrl,
        pricePerHour: Number(pricePerHour),
        type,
        isActive: true,
      },
    });

    return NextResponse.json(newSpace, { status: 201 });
  } catch (error) {
    console.error('Error al crear espacio:', error);
    return NextResponse.json({ error: 'Error interno al crear el espacio' }, { status: 500 });
  }
}
