import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { issueSignupOtp } from '@/lib/signup-otp'
import { sendSignupOtpEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

const schema = z.object({
  name:  z.string().min(2).max(100),
  email: z.string().email(),
})

// Step 1 of sign-up: email a 6-digit code to prove the address is real.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Valid name and email required' }, { status: 400 })
    const { email } = parsed.data

    const existing = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 })

    const code = await issueSignupOtp(email)
    if (!code) {
      return NextResponse.json({ success: false, error: 'A code was just sent. Please wait a minute before requesting another.' }, { status: 429 })
    }

    await sendSignupOtpEmail(email, code, parsed.data.name)
    logger.info('AUTH', 'Signup OTP sent')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[SIGNUP OTP]', err)
    return NextResponse.json({ success: false, error: 'Could not send the verification code. Please try again.' }, { status: 500 })
  }
}
