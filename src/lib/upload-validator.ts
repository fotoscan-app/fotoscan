import { fileTypeFromBuffer } from 'file-type'
import sharp from 'sharp'
import { getObjectBuffer } from './aws-s3'
import { logger } from './logger'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
const ALLOWED_EXT  = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])

export function isAllowedExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return ALLOWED_EXT.has(ext)
}

export function isAllowedContentType(ct: string): boolean {
  return ALLOWED_MIME.has(ct)
}

export async function validateMimeFromS3(s3Key: string): Promise<{ valid: boolean; mimeType: string }> {
  try {
    // Read first 4100 bytes — enough for magic byte detection
    const buffer = await getObjectBuffer(s3Key)
    const slice = buffer.slice(0, 4100)
    const detected = await fileTypeFromBuffer(slice)
    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      logger.warn('UPLOAD', 'Invalid MIME type detected', { file: s3Key, errorCode: 'PS-304' })
      return { valid: false, mimeType: detected?.mime || 'unknown' }
    }
    return { valid: true, mimeType: detected.mime }
  } catch (err) {
    logger.error('UPLOAD', 'MIME validation failed', { file: s3Key })
    return { valid: false, mimeType: 'unknown' }
  }
}

export async function generateThumbnail(
  inputBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const img = sharp(inputBuffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, progressive: true })
    .withMetadata({ exif: {} })
  const meta = await img.metadata()
  const buffer = await img.toBuffer()
  return { buffer, width: meta.width || 0, height: meta.height || 0 }
}

export async function stripExifAndGetMeta(
  inputBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const img = sharp(inputBuffer).withMetadata({ exif: {} })
  const meta = await img.metadata()
  const buffer = await img.toBuffer()
  return { buffer, width: meta.width || 0, height: meta.height || 0 }
}

export async function computePHash(buffer: Buffer): Promise<string> {
  try {
    // Resize to 8x8 grayscale and compute a simple perceptual hash
    const small = await sharp(buffer).resize(8, 8).greyscale().raw().toBuffer()
    const avg = small.reduce((a, b) => a + b, 0) / small.length
    return small.reduce((hash, pixel, i) => hash + (pixel >= avg ? '1' : '0'), '')
  } catch { return '' }
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 999
  return a.split('').filter((c, i) => c !== b[i]).length
}

// Two photos are duplicates if hamming distance <= 5 (out of 64 bits)
export function isDuplicate(newHash: string, existingHash: string): boolean {
  return hammingDistance(newHash, existingHash) <= 5
}
