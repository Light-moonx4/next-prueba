import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./client";

export async function obtenerUrlImagen(
  key: string,
  expiresInSeconds = 3600 // 1 hora por defecto
): Promise<string> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Falta S3_BUCKET_NAME");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}