import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

// Organizer controls for the full-gallery share link (/g/<galleryToken>).
// POST turns sharing on, or issues a new link (old one stops working); DELETE turns it off.

async function ownedEvent(req: NextRequest, params: Promise<{ id: string }>) {
  const token = req.cookies.get(COOKIE)?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return { error: NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 }) }
  const { id } = await params
  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId }, select: { id: true } })
  if (!event) return { error: NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 }) }
  return { event, userId: payload.userId }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await ownedEvent(req, params)
  if ('error' in r) return r.error

  const galleryToken = randomBytes(16).toString('base64url')
  await db.event.update({ where: { id: r.event.id }, data: { galleryToken } })
  logger.info('SYSTEM', 'Gallery share link issued', { userId: r.userId, eventId: r.event.id })
  return NextResponse.json({ success: true, data: { galleryToken } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const r = await ownedEvent(req, params)
  if ('error' in r) return r.error

  await db.event.update({ where: { id: r.event.id }, data: { galleryToken: null } })
  logger.info('SYSTEM', 'Gallery share link disabled', { userId: r.userId, eventId: r.event.id })
  return NextResponse.json({ success: true, data: { galleryToken: null } })
}
