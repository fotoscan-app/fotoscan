import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { deletePhoto } from '@/lib/photo-delete'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message }, { status: 401 })
  const { photoId } = await params

  const body = await req.json()
  const { action } = body // 'approve' | 'remove'
  if (!['approve', 'remove'].includes(action)) {
    return NextResponse.json({ success: false, error: 'Invalid action. Use approve or remove.' }, { status: 400 })
  }

  const photo = await db.photo.findFirst({
    where: { id: photoId },
    include: { event: true, moderationFlag: true },
  })
  if (!photo) return NextResponse.json({ success: false, error: ErrorCodes.PHOTO_NOT_FOUND.message }, { status: 404 })
  if (photo.event.organizerId !== payload.userId) {
    return NextResponse.json({ success: false, error: ErrorCodes.FORBIDDEN.message }, { status: 403 })
  }
  if (!photo.isFlagged) {
    return NextResponse.json({ success: false, error: 'Photo is not flagged for review.' }, { status: 400 })
  }

  if (action === 'approve') {
    await db.$transaction([
      db.photo.update({ where: { id: photoId }, data: { isFlagged: false } }),
      db.moderationFlag.update({ where: { photoId }, data: { isResolved: true, action: 'approved' } }),
      db.event.update({ where: { id: photo.eventId }, data: { pendingReviewCount: { decrement: 1 } } }),
    ])
    logger.info('MODERATION', 'Photo approved', { userId: payload.userId, photoId })
    return NextResponse.json({ success: true, data: { action: 'approved' } })
  }

  // action === 'remove': delete photo entirely
  await deletePhoto(photo, payload.userId)

  logger.info('MODERATION', 'Photo removed', { userId: payload.userId, photoId })
  return NextResponse.json({ success: true, data: { action: 'removed' } })
}
