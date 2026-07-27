import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRazorpay } from '@/lib/razorpay'
import { PLANS, BILLING_CYCLES, getRazorpayPlanId } from '@/lib/plans'
import { db } from '@/lib/db'
import { verifyToken, COOKIE } from '@/lib/auth'
import { logger } from '@/lib/logger'

const schema = z.object({
  planId:  z.enum(['pro', 'studio', 'elite', 'business']),
  cycleId: z.enum(['monthly', 'quarterly', 'halfyearly', 'annual']).default('monthly'),
})

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  if (!token) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 })

  const plan = PLANS.find(p => p.id === parsed.data.planId)
  const cycle = BILLING_CYCLES.find(c => c.id === parsed.data.cycleId)!
  const razorpayPlanId = plan ? getRazorpayPlanId(plan.id, cycle.id) : null
  if (!plan || !razorpayPlanId) {
    return NextResponse.json({ success: false, error: 'Plan not configured — Razorpay plan ID missing in env for this billing cycle' }, { status: 400 })
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

    // total_count scaled so every cycle still renews for ~10 years
    // (120 monthly cycles ≈ 10 years; a cycle billed every N months needs 120/N cycles)
    const totalCount = Math.round(120 / cycle.months)

    const rzp = getRazorpay()
    const subscription = await rzp.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: totalCount,
      notes: { userId: user.id, planId: plan.id, cycle: cycle.id },
    } as Parameters<typeof rzp.subscriptions.create>[0])

    logger.info('BILLING', 'Razorpay subscription created', { userId: user.id, plan: plan.id, cycle: cycle.id })

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: (subscription as { id: string }).id,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    })
  } catch (err) {
    // Razorpay SDK throws plain objects, not Error instances
    const rzpErr = err as { error?: { description?: string; code?: string }; statusCode?: number }
    const msg = rzpErr?.error?.description ?? rzpErr?.error?.code ?? (err instanceof Error ? err.message : JSON.stringify(err))
    logger.error('BILLING', 'Checkout failed', { userId: user.id, plan: plan.id, error: JSON.stringify(err) })
    return NextResponse.json({ success: false, error: `Payment setup failed: ${msg}` }, { status: 500 })
  }
}
