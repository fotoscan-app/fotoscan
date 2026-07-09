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

async function loadFolder(eventId: string, folderId: string, organizerId: string) {
  const event = await db.event.findFirst({ where: { id: eventId, organizerId } })
  if (!event) return { event: null, folder: null }
  const folder = await db.folder.findFirst({ where: { id: folderId, eventId } })
  return { event, folder }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; folderId: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id, folderId } = await params

  const { event, folder } = await loadFolder(id, folderId, payload.userId)
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message, code: ErrorCodes.EVENT_NOT_FOUND.code }, { status: 404 })
  if (!folder) return NextResponse.json({ success: false, error: ErrorCodes.FOLDER_NOT_FOUND.message, code: ErrorCodes.FOLDER_NOT_FOUND.code }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Folder name is required.' }, { status: 400 })

  try {
    const updated = await db.folder.update({
      where: { id: folderId },
      data: { name: parsed.data.name },
      include: { _count: { select: { photos: true } } },
    })
    return NextResponse.json({ success: true, data: { folder: updated } })
  } catch (err: unknown) {
    const prismaErr = err as { code?: string }
    if (prismaErr?.code === 'P2002') {
      return NextResponse.json({ success: false, error: ErrorCodes.DUPLICATE_FOLDER_NAME.message, code: ErrorCodes.DUPLICATE_FOLDER_NAME.code }, { status: 409 })
    }
    logger.error('SYSTEM', 'Folder rename failed', { userId: payload.userId, eventId: id, folderId, errorCode: 'PS-500' })
    return NextResponse.json({ success: false, error: ErrorCodes.SERVER_ERROR.message, code: ErrorCodes.SERVER_ERROR.code }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; folderId: string }> }) {
  const payload = await auth(req)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const { id, folderId } = await params

  const { event, folder } = await loadFolder(id, folderId, payload.userId)
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message, code: ErrorCodes.EVENT_NOT_FOUND.code }, { status: 404 })
  if (!folder) return NextResponse.json({ success: false, error: ErrorCodes.FOLDER_NOT_FOUND.message, code: ErrorCodes.FOLDER_NOT_FOUND.code }, { status: 404 })

  // Photos in this folder are kept — they just become uncategorized (folderId set null via onDelete: SetNull)
  await db.folder.delete({ where: { id: folderId } })
  logger.info('SYSTEM', 'Folder deleted', { userId: payload.userId, eventId: id, folderId })
  return NextResponse.json({ success: true })
}
