import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const customer = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, businessName: true,
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

  return NextResponse.json({
    ...customer,
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
  if (body.plan) data.plan = body.plan

  const updated = await db.user.update({ where: { id }, data,
    select: { id: true, isActive: true, plan: true },
  })
  return NextResponse.json(updated)
}
