import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'

// Identity + capability flags for the signed-in admin, so the admin UI can
// gate controls (e.g. hide the plan selector from restricted admins).
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({
    email: admin.email,
    name: admin.name,
    canManagePlans: admin.adminCanManagePlans,
  })
}
