/** Max edge length after resize — keeps localStorage demos small. */
const MAX_EDGE = 512
/** Soft cap on the encoded data URL (~750KB of base64). */
const MAX_DATA_URL_CHARS = 750_000

const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export type ProfilePhotoResult =
  | { ok: true; dataUrl: string }
  | { ok: false; message: string }

/**
 * Reads a user-picked image, downscales it, and returns a JPEG data URL
 * suitable for persisting in localStorage (no backend).
 */
export async function readProfilePhoto(file: File): Promise<ProfilePhotoResult> {
  if (!ACCEPTED.has(file.type)) {
    return { ok: false, message: 'Use a JPG, PNG, or WebP photo.' }
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, message: 'Photo must be 8 MB or smaller.' }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, message: 'Could not read that image. Try another file.' }
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return { ok: false, message: 'Could not process the photo.' }
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    return {
      ok: false,
      message: 'Photo is still too large after resizing. Try a simpler image.',
    }
  }
  return { ok: true, dataUrl }
}
