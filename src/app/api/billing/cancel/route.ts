import { NextRequest, NextResponse } from 'next/server'
import { getRazorpay } from '@/lib/razorpay'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user?.razorpaySubscriptionId) {
    return NextResponse.json({ success: false, error: 'No active subscription' }, { status: 400 })
  }

  // Cancel at end of current billing cycle (user retains access until period end)
  await getRazorpay().subscriptions.cancel(user.razorpaySubscriptionId, true)

  await db.user.update({
    where: { id: payload.userId },
    data: { subscriptionStatus: 'pending_cancel' },
  })

  logger.info('BILLING', 'Subscription cancel scheduled', { userId: payload.userId })
  return NextResponse.json({ success: true })
}
