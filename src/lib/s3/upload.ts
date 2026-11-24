import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { s3Client } from "./client";

type SubirFotoParams = {
  body: Buffer;
  contentType: string;
  extension: string;
};

export async function subirFoto({
  body,
  contentType,
  extension,
}: SubirFotoParams): Promise<string> {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Falta S3_BUCKET_NAME");

  const key = `fotos/${randomUUID()}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return key;
}