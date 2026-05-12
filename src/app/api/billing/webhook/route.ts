import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { planFromRazorpayPlanId, getPlanById } from '@/lib/plans'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('x-razorpay-signature')
  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (expectedSig !== sig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body) as {
    event: string
    payload: {
      subscription?: { entity: { id: string; plan_id: string; customer_id: string; status: string; notes: { userId?: string } } }
    }
  }

  const sub = event.payload.subscription?.entity

  try {
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        if (!sub) break
        const plan = planFromRazorpayPlanId(sub.plan_id)
        const userId = sub.notes?.userId
        if (!userId) break

        await db.user.update({
          where: { id: userId },
          data: {
            razorpaySubscriptionId: sub.id,
            razorpayCustomerId: sub.customer_id,
            razorpayPlanId: sub.plan_id,
            plan: plan.id,
            subscriptionStatus: 'active',
            storageLimit: BigInt(plan.storageLimit),
          },
        })
        logger.info('BILLING', `Webhook: ${event.event}`, { userId, plan: plan.id })
        break
      }

      case 'subscription.halted': {
        if (!sub) break
        await db.user.update({
          where: { razorpaySubscriptionId: sub.id },
          data: { subscriptionStatus: 'past_due' },
        })
        logger.warn('BILLING', 'Subscription halted (payment failed repeatedly)')
        break
      }

      case 'subscription.cancelled':
      case 'subscription.completed':
      case 'subscription.expired': {
        if (!sub) break
        const starter = getPlanById('starter')
        await db.user.update({
          where: { razorpaySubscriptionId: sub.id },
          data: {
            plan: 'starter',
            subscriptionStatus: 'canceled',
            razorpaySubscriptionId: null,
            razorpayPlanId: null,
            storageLimit: BigInt(starter.storageLimit),
          },
        })
        logger.info('BILLING', `Webhook: ${event.event} — downgraded to starter`)
        break
      }
    }
  } catch (err) {
    logger.error('BILLING', 'Webhook handler error', { event: event.event })
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
