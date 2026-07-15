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

// Difference hash (dHash): each bit compares a pixel to its right-hand neighbor
// rather than to the image's global average. An average hash (the previous
// implementation) only captures rough overall brightness, so many genuinely
// different photos from the same event (same venue/lighting) land within a
// few bits of each other purely by chance and get falsely flagged as
// duplicates. Comparing local gradients instead captures actual structure,
// which is what makes dHash meaningfully more discriminating.
export async function computePHash(buffer: Buffer): Promise<string> {
  try {
    // 9x8 so each of the 8 columns has a right-hand neighbor to compare against
    const { data, info } = await sharp(buffer).resize(9, 8).greyscale().raw().toBuffer({ resolveWithObject: true })
    let hash = ''
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width - 1; x++) {
        const left = data[y * info.width + x]
        const right = data[y * info.width + x + 1]
        hash += left > right ? '1' : '0'
      }
    }
    return hash
  } catch { return '' }
}

export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return 999
  return a.split('').filter((c, i) => c !== b[i]).length
}

// Two photos are duplicates if hamming distance <= 3 (out of 64 bits). Kept
// conservative on purpose: a false positive here silently blocks a real photo
// from being uploaded, while a missed true duplicate just costs a bit of
// storage — so the threshold errs toward under-flagging, not over-flagging.
export function isDuplicate(newHash: string, existingHash: string): boolean {
  return hammingDistance(newHash, existingHash) <= 3
}
