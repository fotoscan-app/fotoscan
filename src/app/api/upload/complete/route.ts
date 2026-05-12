import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { cdnUrl, getObjectBuffer } from '@/lib/aws-s3'
import { uploadBuffer } from '@/lib/aws-s3'
import {
  validateMimeFromS3,
  generateThumbnail,
  stripExifAndGetMeta,
  computePHash,
  hammingDistance,
} from '@/lib/upload-validator'
import {
  indexFaces,
  detectModeration,
  detectLabels,
  detectFaceQuality,
  deleteFaces,
} from '@/lib/aws-rekognition'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'
import { generateS3Key } from '@/lib/utils'

const schema = z.object({
  eventId:  z.string().min(1),
  s3Key:    z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message, code: ErrorCodes.NOT_LOGGED_IN.code }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message, code: ErrorCodes.INVALID_TOKEN.code }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

  const { eventId, s3Key, fileName, fileSize } = parsed.data

  const event = await db.event.findFirst({ where: { id: eventId, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  // Layer 4: MIME magic bytes validation from S3
  const mimeValid = await validateMimeFromS3(s3Key)
  if (!mimeValid.valid) {
    logger.warn('UPLOAD', 'MIME validation failed', { userId: payload.userId, s3Key })
    return NextResponse.json({ success: false, error: ErrorCodes.INVALID_FILE_TYPE.message, code: ErrorCodes.INVALID_FILE_TYPE.code }, { status: 400 })
  }

  // Download full image buffer for processing
  const imageBuffer = await getObjectBuffer(s3Key)
  if (!imageBuffer) {
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }

  // Generate thumbnail + strip EXIF + get dimensions
  const { buffer: thumbBuffer, width, height } = await generateThumbnail(imageBuffer)
  const thumbKey = generateS3Key(eventId, `thumb_${fileName}`)
  await uploadBuffer(thumbKey, thumbBuffer, 'image/jpeg')

  // Compute perceptual hash for duplicate detection
  const pHash = await computePHash(imageBuffer)

  // Check for duplicates in this event
  if (pHash) {
    const existing = await db.photo.findMany({ where: { eventId }, select: { pHash: true, fileName: true } })
    for (const p of existing) {
      if (p.pHash && hammingDistance(pHash, p.pHash) <= 5) {
        logger.warn('UPLOAD', 'Duplicate photo detected', { userId: payload.userId, eventId, fileName })
        return NextResponse.json({ success: false, error: ErrorCodes.DUPLICATE_PHOTO.message, code: ErrorCodes.DUPLICATE_PHOTO.code }, { status: 409 })
      }
    }
  }

  // AWS Rekognition: content moderation
  const modResult = await detectModeration(s3Key)

  // AWS Rekognition: scene labels
  const labelsResult = await detectLabels(s3Key)

  // AWS Rekognition: face quality scoring
  const qualityScore = await detectFaceQuality(s3Key)

  // AWS Rekognition: index faces
  let faceIds: string[] = []
  try {
    faceIds = await indexFaces(event.rekognitionCollectionId, s3Key)
  } catch (err) {
    logger.warn('UPLOAD', 'Face indexing failed', { userId: payload.userId, s3Key })
  }

  const s3Url = cdnUrl(s3Key)

  // Save photo to DB
  const photo = await db.photo.create({
    data: {
      eventId,
      s3Key,
      thumbnailKey: thumbKey,
      s3Url,
      faceIds,
      faceCount: faceIds.length,
      qualityScore,
      labels: labelsResult as object,
      pHash,
      width,
      height,
      fileSize,
      fileName,
      isFlagged: modResult.flagged,
    },
  })

  // Create moderation flag if needed
  if (modResult.flagged) {
    await db.moderationFlag.create({
      data: { photoId: photo.id, reason: modResult.reason!, confidence: modResult.confidence! },
    })
  }

  // Update event and user storage counters atomically
  await db.$transaction([
    db.event.update({
      where: { id: eventId },
      data: {
        photoCount: { increment: 1 },
        pendingReviewCount: modResult.flagged ? { increment: 1 } : undefined,
      },
    }),
    db.user.update({
      where: { id: payload.userId },
      data: { storageUsed: { increment: BigInt(fileSize) } },
    }),
  ])

  // Save labels separately for queryability
  if (labelsResult.length > 0) {
    await db.photoLabel.createMany({
      data: labelsResult.map((l: { label: string; confidence: number }) => ({
        photoId: photo.id, label: l.label, confidence: l.confidence,
      })),
      skipDuplicates: true,
    })
  }

  logger.info('UPLOAD', 'Photo processed', {
    userId: payload.userId, eventId, photoId: photo.id,
    faceCount: faceIds.length, flagged: modResult.flagged,
  })

  return NextResponse.json({
    success: true,
    data: {
      photo: {
        id: photo.id, fileName, fileSize, s3Url,
        faceCount: faceIds.length, qualityScore,
        isFlagged: modResult.flagged,
        flagReason: modResult.flagged ? modResult.reason : null,
      },
    },
  }, { status: 201 })
}
