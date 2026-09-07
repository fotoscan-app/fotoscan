import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { getPlanById } from '@/lib/plans'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const customer = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, mobile: true, businessName: true,
      plan: true, isActive: true, storageUsed: true, storageLimit: true,
      subscriptionStatus: true, createdAt: true, updatedAt: true,
      events: {
        select: {
          id: true, name: true, eventDate: true, status: true,
          photoCount: true, createdAt: true,
          _count: { select: { guestSessions: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Face-scan → download activity per event.
  //  - faceScans      = every selfie submitted (one GuestSession row each)
  //  - downloaders    = distinct guests who saved at least one matched photo
  //  - totalDownloads = number of photo-download click events
  const eventIds = customer.events.map(e => e.id)
  const [scanAgg, downloaderAgg] = eventIds.length
    ? await Promise.all([
        db.guestSession.groupBy({
          by: ['eventId'],
          where: { eventId: { in: eventIds } },
          _count: { _all: true },
          _sum: { downloadCount: true },
        }),
        db.guestSession.groupBy({
          by: ['eventId'],
          where: { eventId: { in: eventIds }, downloadCount: { gt: 0 } },
          _count: { _all: true },
        }),
      ])
    : [[], []]

  const scanByEvent = new Map(scanAgg.map(r => [r.eventId, r]))
  const downloadersByEvent = new Map(downloaderAgg.map(r => [r.eventId, r._count._all]))

  const events = customer.events.map(({ _count, ...e }) => ({
    ...e,
    faceScans:      scanByEvent.get(e.id)?._count._all ?? _count.guestSessions,
    totalDownloads: scanByEvent.get(e.id)?._sum.downloadCount ?? 0,
    downloaders:    downloadersByEvent.get(e.id) ?? 0,
  }))

  return NextResponse.json({
    ...customer,
    events,
    storageUsed:  Number(customer.storageUsed),
    storageLimit: Number(customer.storageLimit),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive
  // Changing plan must also resync storageLimit — otherwise a manual admin
  // downgrade/upgrade leaves the old plan's byte limit in place, same bug
  // class as the stale-default issue on registration.
  if (body.plan) {
    data.plan = body.plan
    data.storageLimit = BigInt(getPlanById(body.plan).storageLimit)
  }

  const updated = await db.user.update({ where: { id }, data,
    select: { id: true, isActive: true, plan: true, storageLimit: true },
  })
  return NextResponse.json(updated)
}
