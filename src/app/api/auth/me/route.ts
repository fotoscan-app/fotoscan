import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { serializeBigInt } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, businessName: true, logoKey: true, plan: true, storageUsed: true, storageLimit: true, subscriptionStatus: true, razorpayCustomerId: true },
  })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  return NextResponse.json({ success: true, data: { user: serializeBigInt(user) } })
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
