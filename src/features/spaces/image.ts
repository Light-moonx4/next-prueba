import { obtenerUrlImagen } from '@/lib/s3/signed-url';

export function isS3ImageKey(value: string): boolean {
  return /^fotos\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(value)
    && !/^https?:\/\//i.test(value)
    && !/^data:/i.test(value);
}

export async function resolveSpaceImageUrl(value: string | null): Promise<string | null> {
  if (!value || !isS3ImageKey(value)) return value;
  return obtenerUrlImagen(value);
}

export async function resolveSpaceImages<T extends { imageUrl: string | null }>(spaces: T[]): Promise<T[]> {
  return Promise.all(spaces.map(async (space) => ({
    ...space,
    imageUrl: await resolveSpaceImageUrl(space.imageUrl),
  })));
}

export function parseSpaceImageUrl(value: unknown): { valid: boolean; imageUrl: string | null } {
  if (value === undefined || value === null || value === '') return { valid: true, imageUrl: null };
  if (typeof value !== 'string') return { valid: false, imageUrl: null };
  const imageUrl = value.trim();
  if (!imageUrl) return { valid: true, imageUrl: null };
  if (isS3ImageKey(imageUrl)) return { valid: true, imageUrl };
  if (imageUrl.length > 3_000_000) return { valid: false, imageUrl: null };
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z\d+/]+=*$/i.test(imageUrl)) {
    return { valid: true, imageUrl };
  }
  try {
    const url = new URL(imageUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      const hasSignature = [...url.searchParams.keys()].some((key) => /^x-amz-/i.test(key));
      if (hasSignature || url.searchParams.has('Signature') || url.searchParams.has('AWSAccessKeyId')) {
        return { valid: false, imageUrl: null };
      }
      return { valid: true, imageUrl };
    }
  } catch {
    // Invalid URLs are rejected below.
  }
  return { valid: false, imageUrl: null };
}
