import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { uploadBuffer, getPresignedDownloadUrl, cdnUrl } from '@/lib/aws-s3'
import { searchFacesBySelfie } from '@/lib/aws-rekognition'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

const MAX_SELFIE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventCode: string }> }) {
  const { eventCode } = await params
  const event = await db.event.findFirst({
    where: { eventCode: eventCode.toUpperCase(), status: 'active' },
  })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  // Accept multipart form with selfie file + guest details
  const formData = await req.formData()
  const selfieFile  = formData.get('selfie')      as File   | null
  const guestName   = (formData.get('guestName')  as string | null)?.trim()   || ''
  const guestMobile = (formData.get('guestMobile') as string | null)?.trim()  || ''

  if (!selfieFile)     return NextResponse.json({ success: false, error: 'No selfie provided.' }, { status: 400 })
  if (!guestName)      return NextResponse.json({ success: false, error: 'Name is required.' }, { status: 400 })
  if (!guestMobile || guestMobile.replace(/\D/g, '').length < 10)
    return NextResponse.json({ success: false, error: 'Valid mobile number is required.' }, { status: 400 })
  if (selfieFile.size > MAX_SELFIE_SIZE) {
    return NextResponse.json({ success: false, error: 'Selfie too large. Max 5 MB.' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(selfieFile.type)) {
    return NextResponse.json({ success: false, error: 'Selfie must be JPEG, PNG, or WebP.' }, { status: 400 })
  }

  // Upload selfie to S3 (temporary, private)
  const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer())
  const selfieKey = `selfies/${event.id}/${Date.now()}.jpg`
  await uploadBuffer(selfieKey, selfieBuffer, selfieFile.type)

  // Search faces — returns { photoId (ExternalImageId), confidence }[]
  let matchResults: { photoId: string; confidence: number }[] = []
  try {
    matchResults = await searchFacesBySelfie(event.rekognitionCollectionId, selfieKey)
  } catch (err) {
    logger.error('FACE_MATCH', 'Face search failed', { eventId: event.id, errorCode: 'PS-401' })
    return NextResponse.json({ success: false, error: ErrorCodes.FACE_SEARCH_FAILED.message, code: ErrorCodes.FACE_SEARCH_FAILED.code }, { status: 500 })
  }

  if (matchResults.length === 0) {
    const session = await db.guestSession.create({
      data: {
        eventId: event.id,
        selfieS3Key: selfieKey,
        matchedPhotoIds: [],
        matchCount: 0,
        guestName,
        guestMobile,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })
    logger.info('FACE_MATCH', 'No faces matched', { eventId: event.id })
    return NextResponse.json({
      success: true,
      data: { sessionToken: session.sessionToken, matchCount: 0, photos: [] },
    })
  }

  // ExternalImageId = photo DB id (set during indexFaces), so match directly by photo id
  const matchedPhotoIdSet = new Set(matchResults.map(m => m.photoId))

  const allPhotos = await db.photo.findMany({
    where: { eventId: event.id, isFlagged: false },
    select: { id: true, fileName: true, fileSize: true, thumbnailKey: true, s3Key: true },
  })

  const matchedPhotos = allPhotos.filter(p => matchedPhotoIdSet.has(p.id))
  const matchedPhotoIds = matchedPhotos.map(p => p.id)

  // Generate presigned download URLs for matched photos
  const photos = await Promise.all(matchedPhotos.map(async p => ({
    id: p.id,
    fileName: p.fileName,
    fileSize: p.fileSize,
    thumbnailUrl: await getPresignedDownloadUrl(p.thumbnailKey || p.s3Key, 3600),
    downloadUrl: event.allowGuestDownload
      ? await getPresignedDownloadUrl(p.s3Key, 3600)
      : null,
  })))

  const session = await db.guestSession.create({
    data: {
      eventId: event.id,
      selfieS3Key: selfieKey,
      matchedPhotoIds,
      matchCount: matchedPhotos.length,
      guestName,
      guestMobile,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  logger.info('FACE_MATCH', 'Match complete', { eventId: event.id, matchCount: matchedPhotos.length })
  return NextResponse.json({
    success: true,
    data: {
      sessionToken: session.sessionToken,
      matchCount: matchedPhotos.length,
      photos,
    },
  })
}
