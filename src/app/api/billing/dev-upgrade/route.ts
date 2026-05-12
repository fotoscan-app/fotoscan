import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { getPlanById } from '@/lib/plans'

const schema = z.object({ planId: z.enum(['starter', 'pro', 'business']) })

export async function POST(req: NextRequest) {
  if (process.env.DEV_BILLING_BYPASS !== 'true') {
    return NextResponse.json({ success: false, error: 'Not available' }, { status: 404 })
  }

  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })

  const plan = getPlanById(parsed.data.planId)

  await db.user.update({
    where: { id: payload.userId },
    data: {
      plan: plan.id,
      subscriptionStatus: plan.id === 'starter' ? 'canceled' : 'active',
      storageLimit: BigInt(plan.storageLimit),
      razorpaySubscriptionId: null,
      razorpayCustomerId: null,
      razorpayPlanId: null,
    },
  })

  return NextResponse.json({ success: true })
}
