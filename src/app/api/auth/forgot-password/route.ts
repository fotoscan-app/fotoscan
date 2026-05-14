import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Valid email required' }, { status: 400 })

    const { email } = parsed.data
    const user = await db.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true })

    // Invalidate any previous OTPs for this email
    await db.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true },
    })

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.passwordReset.create({ data: { email, otp, expiresAt } })
    await sendOtpEmail(email, otp, user.name)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[FORGOT PASSWORD]', err)
    return NextResponse.json({ success: false, error: 'Failed to send OTP. Please try again.' }, { status: 500 })
  }
}
