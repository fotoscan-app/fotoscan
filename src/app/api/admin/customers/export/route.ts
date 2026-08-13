import { NextRequest } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { xlsxResponse } from '@/lib/xlsx-export'

export async function GET(req: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return new Response('Forbidden', { status: 403 })

  // Same filter as /api/admin/customers so "Export" reflects whatever the
  // admin is currently searching for.
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
      name: true, email: true, mobile: true, businessName: true,
      plan: true, isActive: true, storageUsed: true, storageLimit: true,
      subscriptionStatus: true, createdAt: true,
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = customers.map(c => ({
    name:               c.name,
    email:              c.email,
    mobile:             c.mobile || '',
    businessName:       c.businessName || '',
    plan:               c.plan,
    status:             c.isActive ? 'Active' : 'Disabled',
    subscriptionStatus: c.subscriptionStatus,
    events:             c._count.events,
    storageUsedGB:      Number((Number(c.storageUsed) / 1073741824).toFixed(2)),
    storageLimitGB:     Number((Number(c.storageLimit) / 1073741824).toFixed(2)),
    joined:             c.createdAt.toISOString().slice(0, 10),
  }))

  return xlsxResponse('Customers', [
    { header: 'Name',                key: 'name',               width: 24 },
    { header: 'Email',               key: 'email',              width: 28 },
    { header: 'Mobile',              key: 'mobile',             width: 16 },
    { header: 'Business Name',       key: 'businessName',       width: 24 },
    { header: 'Plan',                key: 'plan',               width: 12 },
    { header: 'Status',              key: 'status',             width: 12 },
    { header: 'Subscription Status', key: 'subscriptionStatus', width: 18 },
    { header: 'Events',              key: 'events',             width: 10 },
    { header: 'Storage Used (GB)',   key: 'storageUsedGB',      width: 16 },
    { header: 'Storage Limit (GB)',  key: 'storageLimitGB',     width: 16 },
    { header: 'Joined',              key: 'joined',             width: 14 },
  ], rows, `quickpik-customers-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
