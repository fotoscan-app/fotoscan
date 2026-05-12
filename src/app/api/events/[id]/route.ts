import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { deleteCollection } from '@/lib/aws-rekognition'
import { deleteObject, cdnUrl } from '@/lib/aws-s3'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

async function auth(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({
    where: { id, organizerId: payload.userId },
    include: {
      photos: { orderBy: { uploadedAt: 'desc' } },
      _count: { select: { guestSessions: true } },
    },
  })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message, code: ErrorCodes.EVENT_NOT_FOUND.code }, { status: 404 })

  return NextResponse.json({ success: true, data: { event } })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  const body = await req.json()
  const updated = await db.event.update({
    where: { id },
    data: {
      name:               body.name?.trim()        ?? event.name,
      description:        body.description?.trim() ?? event.description,
      eventDate:          body.eventDate ? new Date(body.eventDate) : event.eventDate,
      venue:              body.venue?.trim()        ?? event.venue,
      status:             body.status               ?? event.status,
      allowGuestDownload: body.allowGuestDownload   ?? event.allowGuestDownload,
    },
  })
  return NextResponse.json({ success: true, data: { event: updated } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId }, include: { photos: true } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  // Delete all S3 files
  const delOps = event.photos.flatMap(p => [
    deleteObject(p.s3Key),
    p.thumbnailKey ? deleteObject(p.thumbnailKey) : Promise.resolve(),
  ])
  if (event.coverPhotoKey) delOps.push(deleteObject(event.coverPhotoKey))
  await Promise.allSettled(delOps)

  // Delete Rekognition collection
  await deleteCollection(event.rekognitionCollectionId)

  // Reclaim storage
  const freed = event.photos.reduce((sum, p) => sum + BigInt(p.fileSize), BigInt(0))
  await db.user.update({ where: { id: payload.userId }, data: { storageUsed: { decrement: freed } } })

  await db.event.delete({ where: { id } })
  logger.info('SYSTEM', 'Event deleted', { userId: payload.userId, eventId: id })
  return NextResponse.json({ success: true })
}
