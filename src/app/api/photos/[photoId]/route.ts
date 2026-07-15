import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { deletePhoto } from '@/lib/photo-delete'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ photoId: string }> }) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message }, { status: 401 })
  const { photoId } = await params

  const photo = await db.photo.findFirst({
    where: { id: photoId },
    include: { event: true, moderationFlag: true },
  })
  if (!photo) return NextResponse.json({ success: false, error: ErrorCodes.PHOTO_NOT_FOUND.message }, { status: 404 })
  if (photo.event.organizerId !== payload.userId) {
    return NextResponse.json({ success: false, error: ErrorCodes.FORBIDDEN.message }, { status: 403 })
  }

  await deletePhoto(photo, payload.userId)

  logger.info('SYSTEM', 'Photo deleted', { userId: payload.userId, photoId })
  return NextResponse.json({ success: true })
}
