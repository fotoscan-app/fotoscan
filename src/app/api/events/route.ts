import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { createCollection } from '@/lib/aws-rekognition'
import { generateEventCode } from '@/lib/utils'
import { cdnUrl } from '@/lib/aws-s3'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

async function auth(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message, code: ErrorCodes.NOT_LOGGED_IN.code }, { status: 401 })

  const events = await db.event.findMany({
    where: { organizerId: payload.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, description: true, eventDate: true, venue: true,
      eventCode: true, status: true, photoCount: true, pendingReviewCount: true,
      allowGuestDownload: true, eventType: true, coverPhotoKey: true, createdAt: true,
      _count: { select: { guestSessions: true } },
      photos: { take: 1, orderBy: { uploadedAt: 'asc' }, select: { s3Key: true } },
    },
  })

  const eventsWithThumbnails = events.map(({ photos, coverPhotoKey, ...ev }) => ({
    ...ev,
    coverPhotoKey,
    thumbnailUrl: coverPhotoKey
      ? cdnUrl(coverPhotoKey)
      : photos[0]?.s3Key
      ? cdnUrl(photos[0].s3Key)
      : null,
  }))
  return NextResponse.json({ success: true, data: { events: eventsWithThumbnails } })
}

const EVENT_TYPES = ['wedding', 'corporate', 'sports', 'school', 'custom'] as const

const createSchema = z.object({
  name:               z.string().min(2).max(200),
  description:        z.string().max(1000).optional(),
  eventDate:          z.string().optional(),
  venue:              z.string().max(200).optional(),
  allowGuestDownload: z.boolean().optional(),
  eventType:          z.enum(EVENT_TYPES).optional(),
})

export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message, code: ErrorCodes.NOT_LOGGED_IN.code }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

    const { name, description, eventDate, venue, allowGuestDownload, eventType } = parsed.data
    const eventCode = generateEventCode()
    const collectionId = `quickpik-${payload.userId.slice(0, 8)}-${eventCode}`.toLowerCase()

    await createCollection(collectionId)

    const event = await db.event.create({
      data: {
        organizerId: payload.userId,
        name: name.trim(),
        description: description?.trim() || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        venue: venue?.trim() || null,
        eventCode,
        rekognitionCollectionId: collectionId,
        allowGuestDownload: allowGuestDownload ?? true,
        eventType: eventType ?? 'custom',
      },
    })

    logger.info('SYSTEM', 'Event created', { userId: payload.userId, eventId: event.id })
    return NextResponse.json({ success: true, data: { event } }, { status: 201 })
  } catch (err) {
    logger.error('SYSTEM', 'Create event failed', { errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }
}
