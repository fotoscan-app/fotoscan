import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { cdnUrl } from '@/lib/aws-s3'
import { ErrorCodes } from '@/lib/error-codes'

const PAGE_SIZE = 48

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

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder') || 'all' // 'all' | 'uncategorized' | folderId
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const where =
    folder === 'all' ? { eventId: id } :
    folder === 'uncategorized' ? { eventId: id, folderId: null } :
    { eventId: id, folderId: folder }

  const [total, rows] = await Promise.all([
    db.photo.count({ where }),
    db.photo.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, fileName: true, fileSize: true, s3Url: true, thumbnailKey: true,
        isFlagged: true, folderId: true,
      },
    }),
  ])

  // The grid renders thumbnails only — the ~800px generated thumbnail, not the
  // full-resolution original — so it stays fast even with hundreds of photos.
  const photos = rows.map(({ thumbnailKey, ...p }) => ({
    ...p, thumbnailUrl: thumbnailKey ? cdnUrl(thumbnailKey) : p.s3Url,
  }))

  return NextResponse.json({
    success: true,
    data: { photos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), limit: PAGE_SIZE },
  })
}
