import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRazorpay } from '@/lib/razorpay'
import { PLANS } from '@/lib/plans'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { logger } from '@/lib/logger'

const schema = z.object({ planId: z.enum(['pro', 'studio', 'business']) })

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })

  const plan = PLANS.find(p => p.id === parsed.data.planId)
  if (!plan?.razorpayPlanId) {
    return NextResponse.json({ success: false, error: 'Plan not configured — Razorpay plan ID missing in env' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  try {
    // Cancel any existing subscription before creating a new one (plan upgrade/downgrade)
    if (user.razorpaySubscriptionId) {
      try {
        await getRazorpay().subscriptions.cancel(user.razorpaySubscriptionId, false)
      } catch { /* already cancelled or expired — continue */ }
      await db.user.update({
        where: { id: user.id },
        data: { razorpaySubscriptionId: null, razorpayPlanId: null },
      })
    }

    // Create or reuse Razorpay customer
    let customerId = user.razorpayCustomerId ?? undefined
    if (!customerId) {
      const rzp = getRazorpay()
      const customer = await rzp.customers.create({
        name: user.name,
        email: user.email,
        fail_existing: 0,
      } as unknown as Parameters<typeof rzp.customers.create>[0])
      customerId = (customer as { id: string }).id
      await db.user.update({ where: { id: user.id }, data: { razorpayCustomerId: customerId } })
    }

    // Create subscription (120 cycles ≈ 10 years, effectively unlimited)
    const rzp = getRazorpay()
    const subscription = await rzp.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: 120,
      notes: { userId: user.id, planId: plan.id },
    } as Parameters<typeof rzp.subscriptions.create>[0])

    logger.info('BILLING', 'Razorpay subscription created', { userId: user.id, plan: plan.id })

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: (subscription as { id: string }).id,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('BILLING', 'Checkout failed', { userId: user.id, plan: plan.id, error: msg })
    return NextResponse.json({ success: false, error: `Payment setup failed: ${msg}` }, { status: 500 })
  }
}
