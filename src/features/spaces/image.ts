export function parseSpaceImageUrl(value: unknown): { valid: boolean; imageUrl: string | null } {
  if (value === undefined || value === null || value === '') return { valid: true, imageUrl: null };
  if (typeof value !== 'string') return { valid: false, imageUrl: null };
  const imageUrl = value.trim();
  if (!imageUrl) return { valid: true, imageUrl: null };
  if (imageUrl.length > 3_000_000) return { valid: false, imageUrl: null };
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-z\d+/]+=*$/i.test(imageUrl)) {
    return { valid: true, imageUrl };
  }
  try {
    const url = new URL(imageUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return { valid: true, imageUrl };
    }
  } catch {
    // Invalid URLs are rejected below.
  }
  return { valid: false, imageUrl: null };
}
