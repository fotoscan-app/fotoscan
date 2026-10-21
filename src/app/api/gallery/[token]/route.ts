import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cdnUrl, getPresignedDownloadUrl } from '@/lib/aws-s3'

const PAGE_SIZE = 48

// Public full-gallery view, reached through the organizer's secret share link.
// Only works while sharing is on (galleryToken set) and the event is active.
// Flagged (moderation) photos are never shown.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const event = await db.event.findFirst({
    where: { galleryToken: token, status: 'active' },
    select: {
      id: true, name: true, eventDate: true, venue: true, allowGuestDownload: true,
      folders: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, _count: { select: { photos: { where: { isFlagged: false } } } } },
      },
    },
  })
  if (!event) return NextResponse.json({ success: false, error: 'This gallery link is invalid or has been turned off.' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder') || 'all' // 'all' | folderId
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const where = folder === 'all'
    ? { eventId: event.id, isFlagged: false }
    : { eventId: event.id, isFlagged: false, folderId: folder }

  const [total, allCount, rows] = await Promise.all([
    db.photo.count({ where }),
    db.photo.count({ where: { eventId: event.id, isFlagged: false } }),
    db.photo.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, fileName: true, fileSize: true, s3Key: true, s3Url: true, thumbnailKey: true },
    }),
  ])

  const photos = await Promise.all(rows.map(async p => ({
    id: p.id,
    fileName: p.fileName,
    fileSize: p.fileSize,
    thumbnailUrl: p.thumbnailKey ? cdnUrl(p.thumbnailKey) : p.s3Url,
    downloadUrl: event.allowGuestDownload ? await getPresignedDownloadUrl(p.s3Key, 3600) : null,
  })))

  const { id: _id, folders, ...info } = event
  return NextResponse.json({
    success: true,
    data: {
      event: { ...info, allCount, folders: folders.filter(f => f._count.photos > 0).map(f => ({ id: f.id, name: f.name, count: f._count.photos })) },
      photos, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    },
  })
}
