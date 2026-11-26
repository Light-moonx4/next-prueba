import { NextResponse } from 'next/server';
import { subirFoto } from '@/lib/s3/upload';
import { prisma } from '@/lib/prisma';
import { authorizeAdmin } from '@/features/auth/admin';
import { obtenerUrlImagen } from '@/lib/s3/signed-url';
import { isS3ImageKey } from '@/features/spaces/image';
const MAX_BYTES = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(req: Request) {
  try {
    const authorization = await authorizeAdmin();
    if (!authorization.ok) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const formData = await req.formData();
    const file = formData.get('foto');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes enviar un archivo en el campo 'foto'" },
        { status: 400 }
      );
    }

    const extension = TIPOS_PERMITIDOS[file.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Formato no permitido. Usa JPG, PNG o WEBP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el límite de 5 MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const key = await subirFoto({
      body: buffer,
      contentType: file.type,
      extension,
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("Error al subir foto a S3:", error);
    return NextResponse.json(
      { error: "No se pudo subir el archivo" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const authorization = await authorizeAdmin();
    if (!authorization.ok) {
      return NextResponse.json({ error: authorization.error }, { status: authorization.status });
    }

    const spaces = await prisma.space.findMany({
      where: { imageUrl: { startsWith: 'fotos/' } },
      select: { imageUrl: true },
    });
    const keys = [...new Set(spaces.map(({ imageUrl }) => imageUrl).filter(
      (key): key is string => key !== null && isS3ImageKey(key),
    ))];
    const images = await Promise.all(keys.map(async (key) => ({ key, url: await obtenerUrlImagen(key) })));

    return NextResponse.json({ images }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Error al listar imágenes guardadas:', error);
    return NextResponse.json({ error: 'No se pudieron listar las imágenes' }, { status: 500 });
  }
}
