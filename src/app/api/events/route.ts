import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { createCollection } from '@/lib/aws-rekognition'
import { generateEventCode } from '@/lib/utils'
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
      allowGuestDownload: true, coverPhotoKey: true, createdAt: true,
      _count: { select: { guestSessions: true } },
    },
  })
  return NextResponse.json({ success: true, data: { events } })
}

const createSchema = z.object({
  name:               z.string().min(2).max(200),
  description:        z.string().max(1000).optional(),
  eventDate:          z.string().optional(),
  venue:              z.string().max(200).optional(),
  allowGuestDownload: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message, code: ErrorCodes.NOT_LOGGED_IN.code }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

    const { name, description, eventDate, venue, allowGuestDownload } = parsed.data
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
      },
    })

    logger.info('SYSTEM', 'Event created', { userId: payload.userId, eventId: event.id })
    return NextResponse.json({ success: true, data: { event } }, { status: 201 })
  } catch (err) {
    logger.error('SYSTEM', 'Create event failed', { errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }
}
