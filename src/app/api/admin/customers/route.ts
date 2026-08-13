import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const search = req.nextUrl.searchParams.get('search') || ''

  const customers = await db.user.findMany({
    where: {
      isAdmin: false,
      ...(search && {
        OR: [
          { name:         { contains: search, mode: 'insensitive' } },
          { email:        { contains: search, mode: 'insensitive' } },
          { businessName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    select: {
      id: true, name: true, email: true, mobile: true, businessName: true,
      plan: true, isActive: true, storageUsed: true,
      subscriptionStatus: true, createdAt: true,
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(customers.map(c => ({
    ...c,
    storageUsed: Number(c.storageUsed),
  })))
}
