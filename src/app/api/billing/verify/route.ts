import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { razorpay } from '@/lib/razorpay'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { planFromRazorpayPlanId } from '@/lib/plans'
import { logger } from '@/lib/logger'

const schema = z.object({
  razorpay_payment_id:     z.string(),
  razorpay_subscription_id: z.string(),
  razorpay_signature:      z.string(),
})

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = parsed.data

  // Verify signature: HMAC-SHA256 of "payment_id|subscription_id"
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex')

  if (expectedSig !== razorpay_signature) {
    logger.warn('BILLING', 'Payment signature mismatch', { userId: payload.userId })
    return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
  }

  // Fetch subscription to get plan details
  const sub = await razorpay.subscriptions.fetch(razorpay_subscription_id) as {
    id: string; plan_id: string; customer_id: string; status: string
  }

  const plan = planFromRazorpayPlanId(sub.plan_id)

  await db.user.update({
    where: { id: payload.userId },
    data: {
      razorpaySubscriptionId: sub.id,
      razorpayCustomerId: sub.customer_id,
      razorpayPlanId: sub.plan_id,
      plan: plan.id,
      subscriptionStatus: 'active',
      storageLimit: BigInt(plan.storageLimit),
    },
  })

  logger.info('BILLING', 'Payment verified, plan activated', { userId: payload.userId, plan: plan.id })
  return NextResponse.json({ success: true })
}
