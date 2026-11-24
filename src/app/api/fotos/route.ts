import { NextResponse } from "next/server";
import { subirFoto } from "@/lib/s3/upload"; // ajusta la ruta si tu proyecto no usa @/ o si está en src/


const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("foto");

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