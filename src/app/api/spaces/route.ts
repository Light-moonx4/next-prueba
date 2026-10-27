import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { parseSpaceImageUrl } from '@/features/spaces/image';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_change_me';

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

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado: se requiere rol de administrador' }, { status: 403 });
    }

    const { name, nameEn, description, descriptionEn, pricePerHour, type, imageUrl } = await request.json();

    const parsedImage = parseSpaceImageUrl(imageUrl);
    if (!parsedImage.valid) {
      return NextResponse.json({ error: 'La imagen debe ser una URL válida o una imagen de hasta 2 MB.' }, { status: 400 });
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
