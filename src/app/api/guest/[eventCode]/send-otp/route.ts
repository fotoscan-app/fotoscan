import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { db } from '@/lib/db'
import { sendVerification, normalizeMobile } from '@/lib/whatsapp'

const schema = z.object({ mobile: z.string().min(7).max(20) })

// Simple in-process rate limiter: max 5 OTP requests per IP per 10 minutes
const ipAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipAttempts.get(ip)
  if (!entry || entry.resetAt < now) {
    ipAttempts.set(ip, { count: 1, resetAt: now + 10 * 60_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventCode: string }> }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please wait 10 minutes.' }, { status: 429 })
  }

  try {
    const { eventCode } = await params

    const event = await db.event.findFirst({
      where: { eventCode: eventCode.toUpperCase(), status: 'active' },
      select: { id: true },
    })
    if (!event) return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Valid mobile number required.' }, { status: 400 })

    const mobile = normalizeMobile(parsed.data.mobile)

    // Skip OTP for a mobile number that has already completed guest verification before
    // (any event) — issue a fresh verifiedToken directly instead of texting a new code.
    const priorVerification = await db.whatsappOtp.findFirst({
      where: { mobile, purpose: 'guest' },
      select: { id: true },
    })

    if (priorVerification) {
      const verifiedToken = randomUUID()
      await db.whatsappOtp.create({
        data: {
          mobile,
          code: 'verified',
          purpose: 'guest',
          refId: eventCode.toUpperCase(),
          verifiedToken,
          used: false,
          expiresAt: new Date(Date.now() + 15 * 60_000),
        },
      })
      return NextResponse.json({ success: true, data: { otpRequired: false, verifiedToken } })
    }

    await sendVerification(mobile)

    return NextResponse.json({ success: true, data: { otpRequired: true } })
  } catch (err: unknown) {
    const twilioErr = err as { code?: number; message?: string; status?: number }
    console.error('[SEND-OTP]', twilioErr?.code, twilioErr?.message)

    if (twilioErr?.code === 60203) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please wait before requesting another OTP.' }, { status: 429 })
    }
    if (twilioErr?.code === 21211 || twilioErr?.code === 21614) {
      return NextResponse.json({ success: false, error: 'Invalid mobile number. Please check and try again.' }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Could not send OTP. Please try again.' }, { status: 500 })
  }
}
