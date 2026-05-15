import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    totalUsers, activeUsers, newThisMonth,
    totalEvents, totalPhotos, totalGuestSessions,
    planCounts, storageAgg,
  ] = await Promise.all([
    db.user.count({ where: { isAdmin: false } }),
    db.user.count({ where: { isAdmin: false, isActive: true } }),
    db.user.count({ where: { isAdmin: false, createdAt: { gte: startOfMonth } } }),
    db.event.count(),
    db.photo.count(),
    db.guestSession.count(),
    db.user.groupBy({ by: ['plan'], where: { isAdmin: false }, _count: { plan: true } }),
    db.user.aggregate({ _sum: { storageUsed: true } }),
  ])

  const plans: Record<string, number> = {}
  for (const p of planCounts) plans[p.plan] = p._count.plan ?? 0

  return NextResponse.json({
    totalUsers, activeUsers, newThisMonth,
    totalEvents, totalPhotos, totalGuestSessions,
    plans,
    totalStorageBytes: Number(storageAgg._sum.storageUsed ?? 0),
  })
}
