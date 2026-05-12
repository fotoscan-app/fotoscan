import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cdnUrl } from '@/lib/aws-s3'
import { ErrorCodes } from '@/lib/error-codes'

// Public endpoint — no auth required. Returns event info + organizer branding for the guest page.
export async function GET(req: NextRequest, { params }: { params: Promise<{ eventCode: string }> }) {
  const { eventCode } = await params
  const event = await db.event.findFirst({
    where: { eventCode: eventCode.toUpperCase(), status: 'active' },
    include: { organizer: { select: { name: true, businessName: true, logoKey: true } } },
  })
  if (!event) return NextResponse.json({ success: false, error: ErrorCodes.EVENT_NOT_FOUND.message }, { status: 404 })

  return NextResponse.json({
    success: true,
    data: {
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        eventDate: event.eventDate,
        venue: event.venue,
        photoCount: event.photoCount,
        allowGuestDownload: event.allowGuestDownload,
      },
      branding: {
        businessName: event.organizer.businessName || event.organizer.name,
        logoUrl: event.organizer.logoKey ? cdnUrl(event.organizer.logoKey) : null,
      },
    },
  })
}
