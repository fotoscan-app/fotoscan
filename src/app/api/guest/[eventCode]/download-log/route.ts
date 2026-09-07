import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ErrorCodes } from '@/lib/error-codes'

// Records that a guest downloaded one or more of their matched photos.
// Called (best-effort, via sendBeacon) from the guest results page when a
// download link is clicked. There is no auth — the sessionToken is the proof
// the caller owns the session, same as the session-resume endpoint.
export async function POST(req: NextRequest, { params }: { params: Promise<{ eventCode: string }> }) {
  const { eventCode } = await params

  let body: { sessionToken?: string; photoIds?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Bad request.' }, { status: 400 })
  }

  const sessionToken = typeof body.sessionToken === 'string' ? body.sessionToken : ''
  const photoIds = Array.isArray(body.photoIds)
    ? body.photoIds.filter((p): p is string => typeof p === 'string')
    : []
  if (!sessionToken || photoIds.length === 0) {
    return NextResponse.json({ success: false, error: 'Bad request.' }, { status: 400 })
  }

  const event = await db.event.findFirst({
    where: { eventCode: eventCode.toUpperCase() },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  const session = await db.guestSession.findFirst({
    where: { sessionToken, eventId: event.id, expiresAt: { gt: new Date() } },
    select: { id: true, matchedPhotoIds: true, downloadedPhotoIds: true },
  })
  if (!session) {
    return NextResponse.json({ success: false, error: 'Session not found or expired.' }, { status: 404 })
  }

  // Only count downloads of photos that were actually matched to this guest.
  const matched = new Set(session.matchedPhotoIds)
  const requested = [...new Set(photoIds)].filter(id => matched.has(id))
  if (requested.length === 0) {
    return new NextResponse(null, { status: 204 })
  }

  const mergedDownloaded = [...new Set([...session.downloadedPhotoIds, ...requested])]

  await db.guestSession.update({
    where: { id: session.id },
    data: {
      downloadCount: { increment: requested.length },
      downloadedPhotoIds: mergedDownloaded,
      lastDownloadAt: new Date(),
    },
  })

  return new NextResponse(null, { status: 204 })
}
