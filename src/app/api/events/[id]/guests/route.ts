import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { ErrorCodes } from '@/lib/error-codes'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message }, { status: 401 })

  const { id } = await params
  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  const guests = await db.guestSession.findMany({
    where: { eventId: id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, guestName: true, guestMobile: true,
      matchCount: true, createdAt: true, sessionToken: true,
    },
  })

  return NextResponse.json({ success: true, data: { guests } })
}
