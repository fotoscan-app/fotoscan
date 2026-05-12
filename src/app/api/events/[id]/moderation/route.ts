import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { cdnUrl, getPresignedDownloadUrl } from '@/lib/aws-s3'
import { ErrorCodes } from '@/lib/error-codes'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: ErrorCodes.NOT_LOGGED_IN.message }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: ErrorCodes.INVALID_TOKEN.message }, { status: 401 })
  const { id } = await params

  const event = await db.event.findFirst({ where: { id, organizerId: payload.userId } })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  const flagged = await db.photo.findMany({
    where: { eventId: id, isFlagged: true },
    include: { moderationFlag: true },
    orderBy: { uploadedAt: 'desc' },
  })

  const photos = await Promise.all(flagged.map(async p => ({
    id: p.id, fileName: p.fileName, fileSize: p.fileSize,
    reason: p.moderationFlag?.reason || 'Unknown',
    confidence: p.moderationFlag?.confidence || 0,
    viewUrl: await getPresignedDownloadUrl(p.thumbnailKey || p.s3Key, 3600),
  })))

  return NextResponse.json({ success: true, data: { photos } })
}
