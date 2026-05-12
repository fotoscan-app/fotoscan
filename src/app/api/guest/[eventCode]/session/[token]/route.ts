import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getPresignedDownloadUrl } from '@/lib/aws-s3'
import { ErrorCodes } from '@/lib/error-codes'

// Allows a guest to resume their session (e.g., after page refresh or returning via link)
export async function GET(req: NextRequest, { params }: { params: Promise<{ eventCode: string; token: string }> }) {
  const { eventCode, token: sessionToken } = await params
  const event = await db.event.findFirst({
    where: { eventCode: eventCode.toUpperCase() },
    select: { id: true, allowGuestDownload: true },
  })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  const session = await db.guestSession.findFirst({
    where: {
      sessionToken,
      eventId: event.id,
      expiresAt: { gt: new Date() },
    },
  })
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found or expired.' }, { status: 404 })
  }

  if (session.matchedPhotoIds.length === 0) {
    return NextResponse.json({ success: true, data: { matchCount: 0, photos: [] } })
  }

  const photos = await db.photo.findMany({
    where: { id: { in: session.matchedPhotoIds }, isFlagged: false },
    select: { id: true, fileName: true, fileSize: true, thumbnailKey: true, s3Key: true },
  })

  const photosWithUrls = await Promise.all(photos.map(async p => ({
    id: p.id,
    fileName: p.fileName,
    fileSize: p.fileSize,
    thumbnailUrl: await getPresignedDownloadUrl(p.thumbnailKey || p.s3Key, 3600),
    downloadUrl: event.allowGuestDownload
      ? await getPresignedDownloadUrl(p.s3Key, 3600)
      : null,
  })))

  return NextResponse.json({
    success: true,
    data: { matchCount: photosWithUrls.length, photos: photosWithUrls },
  })
}
