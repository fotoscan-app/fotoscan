import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { ErrorCodes } from '@/lib/error-codes'

const schema = z.object({ name: z.string().trim().min(1).max(100) })

async function auth(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message, code: ErrorCodes.EVENT_NOT_FOUND.code }, { status: 404 })

  const folders = await db.folder.findMany({
    where: { eventId: id },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { photos: true } } },
  })
  return NextResponse.json({ success: true, data: { folders } })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message, code: ErrorCodes.EVENT_NOT_FOUND.code }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Folder name is required.' }, { status: 400 })

  try {
    const folder = await db.folder.create({
      data: { eventId: id, name: parsed.data.name },
      include: { _count: { select: { photos: true } } },
    })
    logger.info('SYSTEM', 'Folder created', { userId: payload.userId, eventId: id, folderId: folder.id })
    return NextResponse.json({ success: true, data: { folder } }, { status: 201 })
  } catch (err: unknown) {
    const prismaErr = err as { code?: string }
    if (prismaErr?.code === 'P2002') {
      return NextResponse.json({ success: false, error: ErrorCodes.DUPLICATE_FOLDER_NAME.message, code: ErrorCodes.DUPLICATE_FOLDER_NAME.code }, { status: 409 })
    }
    logger.error('SYSTEM', 'Folder creation failed', { userId: payload.userId, eventId: id, errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }
}
